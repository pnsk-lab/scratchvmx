import { createBlocks } from "../blocks/mod.ts";
import { compile } from "../compiler/mod.ts";
import { Render } from "../renderer.ts";
import type { Project } from "../types.ts";

export interface RunnerInit {
  canvas: HTMLCanvasElement
  project: Project
}

export class Runner {
  #init: RunnerInit
  #renderer: Render
  #project: Project
  constructor(init: RunnerInit) {
    this.#init = init
    this.#renderer = new Render(init.canvas)
    this.#renderer.resize(480, 360)
    this.#project = init.project
  }
  async start() {
    const projectJSON = this.#project.json
    const blocks = createBlocks()

    compile(projectJSON.targets[1].blocks)

  }
}
