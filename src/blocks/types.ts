export interface TopLevelBlockImpl {
  topLevel: true
  generate(args: Args, fn: string): string
}
export interface NormalBlockImpl {
  topLevel: false
  generate(args: Args): string
}
export type BlockImpl = TopLevelBlockImpl | NormalBlockImpl

export interface Args {
  inputs?: {}
  substacks: Record<string, string>
}
