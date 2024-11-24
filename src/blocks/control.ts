import type { BlockImpl } from './types.ts'

export const control_forever: BlockImpl = {
  topLevel: false,
  generate(args) {
    const substack = args.substacks.SUBSTACK
    if (!substack) {
      return ''
    }
    return `while (true) { ${substack}; yield null }`
  },
}
