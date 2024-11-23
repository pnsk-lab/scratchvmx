import * as control from './control.ts'
import * as events from './event.ts'
import * as motion from './motion.ts'
import type { BlockImpl } from './types.ts'

export const createBlocks = (): Record<string, BlockImpl> => {
  return {
    ...control,
    ...events,
    ...motion,
  }
}
