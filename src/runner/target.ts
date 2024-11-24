import type { Sprite, Stage } from '@pnsk-lab/sb3-types'
import type { Runner } from '../mod.ts'
import type { Render } from '../renderer.ts'
import { compile } from '../compiler/mod.ts'
import type { VMData, VMEvent } from './types.ts'
import type { VMAsyncGeneratorFunction } from './types.ts'
import { createBlocks } from '../blocks/mod.ts'

interface RunnerTargetInit {
  runner: Runner
  target: Sprite | Stage
}

export class RunnerTarget {
  #drawableId: number
  #skinIds: Map<string, number>

  // Runner data
  x: number
  y: number
  direction: number

  #lastDrawData: {
    x: number
    y: number
    direction: number
  }

  #renderer: Render
  #target: Sprite | Stage
  #compiled: {
    fn(vmdata: VMData): void
    code: string
  }[]
  #runner: Runner

  constructor(init: RunnerTargetInit) {
    this.#renderer = init.runner.renderer
    this.#drawableId = init.runner.renderer.createDrawable(init.target.name)
    this.#target = init.target
    this.#runner = init.runner

    this.x = 0
    this.y = 0
    this.direction = 90

    this.#lastDrawData = {
      x: this.x,
      y: this.y,
      direction: this.direction
    }

    this.#skinIds = new Map(init.target.costumes.flatMap((costume) => {
      const asset = init.runner.project.assets.get(costume.assetId)
      if (!asset) {
        return []
      }
      if (asset.type !== 'image') {
        return []
      }
      const skinId = asset.ext === 'svg' ? this.#renderer.createSVGSkin(asset.svg) : init.runner.renderer.createBitmapSkin(asset.image)
      return [[costume.assetId, skinId]]
    }))

    this.#renderer.updateDrawableSkinId(this.#drawableId, [...this.#skinIds][0][1])

    this.#compiled = compile(this.#target.blocks)
      .map(code => ({
        fn: new Function('vmdata', code) as ((vmdata: VMData) => void),
        code
      }))
  }

  getBounds() {
    return this.#renderer.getBounds(this.#drawableId)
  }

  render() {
    if (this.x !== this.#lastDrawData.x || this.y !== this.#lastDrawData.y) {
      // Render position
      this.#renderer.updateDrawablePosition(this.#drawableId, [
        this.x,
        this.y
      ])
    }
    if (this.direction !== this.#lastDrawData.direction) {
      // Render direction
      this.#renderer.updateDrawableDirection(this.#drawableId, this.direction)
    }
    this.#lastDrawData = {
      x: this.x,
      y: this.y,
      direction: this.direction
    }
  }

  async * start () {
    const events = new Map<VMEvent, VMAsyncGeneratorFunction[]>()
    const blockImpls = createBlocks()
  
    const vmdata: VMData = {
      target: this,
      on(type, listener) {
        if (!events.has(type)) {
          events.set(type, [])
        }
        events.get(type)?.push(listener)
      },
      blockImpls,
      runner: this.#runner
    }
    for (const { fn } of this.#compiled) {
      fn(vmdata)
    }
    
    const runnings: AsyncGenerator[] = []
    for (const flag of events.get('flag') ?? []) {
      runnings.push(flag())
    }
    
    while (true) {
      const runningResults = await Promise.all(runnings.map(running => running.next()))
      const indexesToRemove: number[] = []
      for (const [i, runningResult] of runningResults.entries()) {
        if (runningResult.done) {
          indexesToRemove.push(i)
        }
      }
      for (const indexToRemove of indexesToRemove.reverse()) {
        runnings.splice(indexToRemove, 1)
      }
      if (runnings.length === 0) {
        break
      }
      this.render()
      yield null
    }
  }
}
