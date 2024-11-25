import { createBlocks } from '../blocks/mod.ts'
import { compile } from '../compiler/mod.ts'
import { Mouse } from '../io/mouse.ts'
import { Render } from '../renderer.ts'
import type { Project } from '../types.ts'
import { SPRITE_LAYER, STAGE_LAYER } from './constants.ts'
import { RunnerTarget } from './target.ts'
import type { VMData } from './types.ts'

export interface RunnerInit {
  canvas: HTMLCanvasElement
  project: Project

  /**
   * @defaults 480
   */
  width?: number
  /**
   * @defaults 360
   */
  height?: number
}

export class Runner {
  #init: RunnerInit
  readonly width: number
  readonly height: number
  readonly renderer: Render
  readonly project: Project

  #runnerTargets: RunnerTarget[]
  readonly mouse: Mouse

  readonly stage: RunnerTarget
  constructor(init: RunnerInit) {
    this.#init = init
    this.project = init.project
    this.renderer = new Render(init.canvas)

    this.width = init.width ?? 480
    this.height = init.height ?? 360
    this.renderer.resize(this.width, this.height)

    const projectJSON = this.project.json

    this.renderer.setLayerGroupOrdering([
      STAGE_LAYER,
      SPRITE_LAYER,
    ])
    this.#runnerTargets = projectJSON.targets.map((target) =>
      new RunnerTarget({
        target,
        runner: this,
      })
    )

    this.stage = this.#runnerTargets.find((r) => r.isStage)!

    this.mouse = new Mouse({
      width: this.width,
      height: this.height,
      canvas: this.#init.canvas,
    })
  }

  #cachedTargetFromName = new Map<string, RunnerTarget>()
  getTargetFromName(name: string) {
    const cached = this.#cachedTargetFromName.get(name)
    if (cached) {
      return cached
    }
    const got = this.#runnerTargets.find((target) => target.name === name)
    if (got) {
      this.#cachedTargetFromName.set(name, got)
      return got
    }
    return null
  }

  readonly abortController = new AbortController()

  async start() {
    const generators = this.#runnerTargets.map((target) =>
      target.start(this.abortController)
    )

    while (true) {
      await Promise.all(generators.map((generator) => generator.next()))
      this.renderer.draw()
      if (this.abortController.signal.aborted) {
        break
      }
      for (const target of this.#runnerTargets) {
        target.render()
      }
      await new Promise(requestAnimationFrame)
    }
  }
  cleanup() {
    this.mouse.unmount()
    this.abortController.abort()
  }
}
