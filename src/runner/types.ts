import type { BlockImpl } from '../blocks/types.ts'
import type { Runner } from './mod.ts'
import type { RunnerTarget } from './target.ts'

export type VMEvent = 'flag' | 'cloned'
export type VMAsyncGenerator = AsyncGenerator<VMData>
export type VMAsyncGeneratorData = {
  generator: VMAsyncGenerator
  targetId: string
  generatorId: string
}
export type VMAsyncGeneratorFunction = (vmdata: VMData) => VMAsyncGenerator
export type VMAsyncGeneratorFunctionData = {
  fn: VMAsyncGeneratorFunction
  targetId: string
  target: RunnerTarget
}
export interface VMInitializerAddEvent {
  (type: VMEvent, listener: VMAsyncGeneratorFunction): void
}
export type VMBlocksInitializer = (addEvent: VMInitializerAddEvent) => void

export interface VMData {
  target: RunnerTarget
  blockImpls: Record<string, BlockImpl>
  runner: Runner
  targetId: string
  generatorId: string
}
export type YieldResult = {
  waitMode: 'frame'
}
