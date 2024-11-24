import { createBlocks } from '../blocks/mod.ts'
import { compile } from '../compiler/mod.ts'
import { Render } from '../renderer.ts'
import type { Project } from '../types.ts'
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
  constructor(init: RunnerInit) {
    this.#init = init
    this.project = init.project
    this.renderer = new Render(init.canvas)

    this.width = init.width ?? 480
    this.height = init.height ?? 360
    this.renderer.resize(this.width, this.height)

    const projectJSON = this.project.json

    this.renderer.setLayerGroupOrdering(projectJSON.targets.map((target) => target.name))

    this.#runnerTargets = projectJSON.targets.map(target => new RunnerTarget({
      target,
      runner: this,
    }))
  }
  async start() {
    const generators = this.#runnerTargets.map(target => target.start())
  
    while (true) {
      await Promise.all(generators.map(generator => generator.next()))
      this.renderer.draw()
      await new Promise(requestAnimationFrame)
    }
  }
}
