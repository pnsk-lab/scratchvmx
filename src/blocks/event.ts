import type { BlockImpl } from './types.ts'

export const event_whenflagclicked: BlockImpl = {
  topLevel: true,
  generate(_args, fn) {
    return `vmdata.on('flag', ${fn})`
  },
}
