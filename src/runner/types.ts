import type { BlockImpl } from '../blocks/types.ts'
import type { Runner } from './mod.ts'
import type { RunnerTarget } from './target.ts'

export type VMEvent = 'flag'
export type VMAsyncGenerator = AsyncGenerator<VMData>
export type VMAsyncGeneratorFunction = () => VMAsyncGenerator

export interface VMData {
  target: RunnerTarget
  on(type: VMEvent, listener: VMAsyncGeneratorFunction): void
  blockImpls: Record<string, BlockImpl>
  runner: Runner
}
export type YieldResult = {
  waitMode: 'frame'
}
