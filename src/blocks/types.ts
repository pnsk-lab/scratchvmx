export interface TopLevelBlockImpl<T extends string = never> {
  topLevel: true
  generate(
    args: Args<T> & {
      fn: string
    },
  ): string
  bindings?: Record<T, unknown>
}
export interface NormalBlockImpl<T extends string = never> {
  topLevel: false
  generate(args: Args<T>): string
  bindings?: Record<T, unknown>
}

export type BlockImpl<T extends string = never> =
  | TopLevelBlockImpl<T>
  | NormalBlockImpl<T>

export interface Args<T extends string> {
  inputs: Record<string, string>
  fields: Record<string, string>
  substacks: Record<string, string>
  bindings: Record<T, string>
}
