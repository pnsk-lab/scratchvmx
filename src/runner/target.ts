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
  readonly costumes: {
    skinId: number
  }[]

  readonly name: string

  // Runner data
  x: number
  y: number
  direction: number
  costume: number
  rotationStyle: 'all around' | 'left-right' | 'don\'t rocate'

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
    this.name = init.target.name
    this.rotationStyle = 'all around'

    this.x = 0
    this.y = 0
    this.direction = 90
    this.costume = 0

    this.costumes = init.target.costumes.flatMap((costume) => {
      const asset = init.runner.project.assets.get(costume.assetId)
      if (!asset) {
        return []
      }
      if (asset.type !== 'image') {
        return []
      }
      const skinId = asset.ext === 'svg'
        ? this.#renderer.createSVGSkin(asset.svg)
        : init.runner.renderer.createBitmapSkin(asset.image)
      return [{
        skinId,
      }]
    })
    this.#renderer.updateDrawableSkinId(
      this.#drawableId,
      this.costumes[this.costume].skinId,
    )

    this.#compiled = compile(this.#target.blocks)
      .map((code) => ({
        fn: new Function('vmdata', code) as ((vmdata: VMData) => void),
        code,
      }))
  }

  getBounds() {
    return this.#renderer.getBounds(this.#drawableId)
  }

  render() {
    // Render position
    this.#renderer.updateDrawablePosition(this.#drawableId, [
      this.x,
      this.y,
    ])
  
    // Render direction and scale
    this.direction = this.direction % 360
    if (this.direction > 180) {
      this.direction = -(360 - this.direction)
    }
    let resultDirection = this.direction
    const resultScale = [100, 100]

    switch (this.rotationStyle) {
      case 'all around':
        break
      case 'left-right':
        if (resultDirection < 0) {
          resultDirection = 90
          resultScale[0] *= -1
        }
        resultDirection = 90
        break
      case 'don\'t rocate':
        resultDirection = 90
    }
    this.#renderer.updateDrawableDirectionScale(this.#drawableId, resultDirection,
      // @ts-expect-error Turbowarp types bug
      resultScale)
    this.#renderer.updateDrawableSkinId(
      this.#drawableId,
      this.costumes[this.costume].skinId,
    )
  }

  async *start(abortController: AbortController) {
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
      runner: this.#runner,
    }
    for (const { fn } of this.#compiled) {
      fn(vmdata)
    }

    const runnings: AsyncGenerator[] = []
    for (const flag of events.get('flag') ?? []) {
      runnings.push(flag())
    }

    while (true) {
      const runningResults = await Promise.all(
        runnings.map((running) => running.next()),
      )
      const indexesToRemove: number[] = []
      for (const [i, runningResult] of runningResults.entries()) {
        if (runningResult.done) {
          indexesToRemove.push(i)
        }
      }
      for (const indexToRemove of indexesToRemove.reverse()) {
        runnings.splice(indexToRemove, 1)
      }
      if (runnings.length === 0 || abortController.signal.aborted) {
        break
      }
      this.render()
      yield null
    }
  }
}
