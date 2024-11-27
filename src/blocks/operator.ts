import type { BlockImpl } from './types.ts'
import { isEquals } from './shared/compare.ts'

export const operator_equals: BlockImpl<'isEquals'> = {
  topLevel: false,
  generate(args) {
    return `${args.bindings.isEquals}(${args.inputs.OPERAND1}, ${args.inputs.OPERAND2})`
  },
  bindings: {
    isEquals
  }
}