import { createBlocks } from '../blocks/mod.ts'
import { compile } from '../compiler/mod.ts'
import { Render } from '../renderer.ts'
import type { Project } from '../types.ts'
import { RunnerTarget } from './target.ts'
import type { VMData } from './types.ts'

export interface RunnerInit {
  canvas: HTMLCanvasElement
  project: Project
}

export class Runner {
  #init: RunnerInit
  readonly renderer: Render
  readonly project: Project
  constructor(init: RunnerInit) {
    this.#init = init
    this.renderer = new Render(init.canvas)
    this.renderer.resize(480, 360)
    this.project = init.project
  }

  async start() {
    const projectJSON = this.project.json

    this.renderer.setLayerGroupOrdering(projectJSON.targets.map((target) => target.name))

    const target = new RunnerTarget({
      target: projectJSON.targets[1],
      runner: this,
    })

    const step = () => {
      this.renderer.draw()
      requestAnimationFrame(step)
    }
    step()
  }
}
