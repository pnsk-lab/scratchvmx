import type { BlockImpl } from './types.ts'

export const event_whenflagclicked: BlockImpl = {
  topLevel: true,
  generate(args) {
    return `addEvent('flag', ${args.fn})`
  },
}
