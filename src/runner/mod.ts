import { createBlocks } from '../blocks/mod.ts'
import { compile } from '../compiler/mod.ts'
import { Mouse } from '../io/mouse.ts'
import { Render } from '../renderer.ts'
import type { Project } from '../types.ts'
import { SPRITE_LAYER, STAGE_LAYER } from './constants.ts'
import { RunnerTarget } from './target.ts'
import type {
  VMAsyncGenerator,
  VMAsyncGeneratorData,
  VMAsyncGeneratorFunction,
  VMAsyncGeneratorFunctionData,
  VMBlocksInitializer,
  VMData,
  VMInitializerAddEvent,
} from './types.ts'

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

  readonly mouse: Mouse
  runnerTargets?: RunnerTarget[]
  stage?: RunnerTarget

  #compiled: Map<string, VMBlocksInitializer>

  readonly blockImpls = createBlocks()

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

    this.mouse = new Mouse({
      width: this.width,
      height: this.height,
      canvas: this.#init.canvas,
    })

    this.#compiled = new Map()
    for (const target of init.project.json.targets) {
      this.#compiled.set(
        target.name,
        new Function('addEvent', compile(target.blocks)) as VMBlocksInitializer,
      )
    }
  }

  #generatorId: number = 0
  #startFn(data: VMAsyncGeneratorFunctionData) {
    this.#generatorId++
    const vmdata: VMData = {
      blockImpls: this.blockImpls,
      runner: this,
      target: data.target,
      generatorId: this.#generatorId.toString(),
      targetId: data.targetId,
    }
    this.runningGenerators.push({
      generator: data.fn(vmdata),
      targetId: data.targetId,
      generatorId: vmdata.generatorId,
    })
  }

  flag() {
    this.#startRunning()
    for (const data of this.#runnableGenerators.get('flag') ?? []) {
      this.#startFn(data)
    }
  }

  #targetId: number = 0
  createTarget(runnerTarget: RunnerTarget) {
    this.#targetId++
    const initializer = this.#compiled.get(runnerTarget.name)
    if (!initializer) throw new Error('Initializer is undefined.')
    const targetId = this.#targetId.toString()
    runnerTarget.targetId = targetId
    this.runnerTargets?.push(runnerTarget)
    const addEvent: VMInitializerAddEvent = (type, listener) => {
      const data: VMAsyncGeneratorFunctionData = {
        fn: listener,
        targetId,
        target: runnerTarget,
      }
      if (type === 'cloned') {
        if (runnerTarget.isClone) {
          this.#startFn(data)
        }
        return
      }
      const listeners = this.#runnableGenerators.get(type)
      if (listeners){
        listeners.push(data)
      } else {
        this.#runnableGenerators.set(type, [data])
      }
    }
    initializer(addEvent)
  }

  #runnableGenerators: Map<string, VMAsyncGeneratorFunctionData[]> = new Map()
  runningGenerators: VMAsyncGeneratorData[] = []
  #isStarted = false
  #startRunning() {
    if (this.#isStarted) {
      return
    }
    this.#isStarted = true
    this.#runnableGenerators = new Map()
    this.runningGenerators = []

    this.runnerTargets = []
    for (const target of this.#init.project.json.targets) {
      const runnerTarget = new RunnerTarget({
        runner: this,
        target,
        isClone: false,
      })
      if (target.isStage) {
        this.stage = runnerTarget
      }
      this.createTarget(runnerTarget)
    }

    const step = async () => {
      const removeIndexes = []
      for (
        const [i, { done }]
          of (await Promise.all(
            this.runningGenerators.map((g) => g.generator.next()),
          ))
            .entries()
      ) {
        if (done) {
          removeIndexes.push(i)
        }
      }
      for (const index of removeIndexes.reverse()) {
        this.runningGenerators.splice(index, 0)
      }
      for (const target of this.runnerTargets ?? []) {
        target.render()
      }
      this.renderer.draw()
      if (this.abortController.signal.aborted) {
        return
      }
      requestAnimationFrame(step)
    }
    step()
  }

  stop() {
    this.runningGenerators = []
  }

  #cachedTargetFromName = new Map<string, RunnerTarget>()
  getTargetFromName(name: string) {
    const cached = this.#cachedTargetFromName.get(name)
    if (cached) {
      return cached
    }
    const got = this.runnerTargets?.find((target) => target.name === name)
    if (got) {
      this.#cachedTargetFromName.set(name, got)
      return got
    }
    return null
  }

  readonly abortController = new AbortController()
  cleanup() {
    this.mouse.unmount()
    this.abortController.abort()
  }
}
