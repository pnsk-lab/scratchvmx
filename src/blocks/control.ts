import type { BlockImpl } from './types.ts'
import { waitForSec } from './shared/time.ts'

export const control_wait: BlockImpl<'waitForSec'> = {
  topLevel: false,
  generate(args) {
    return `for await (const _ of ${args.bindings.waitForSec}(${args.inputs.DURATION})) { yield _ }`
  },
  bindings: {
    waitForSec,
  },
}
export const control_repeat: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `for (let i = 0; i < ${args.inputs.TIMES}; i++) {
      ${args.substacks.SUBSTACK}
      yield null
    }`
  },
}
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
export const control_if: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `if (${args.inputs.CONDITION ?? 'false'}) {
      ${args.substacks.SUBSTACK}
    }`
  },
}
export const control_if_else: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `
    if (${args.inputs.CONDITION ?? 'false'}) {
      ${args.substacks.SUBSTACK}
    } else {
      ${args.substacks.SUBSTACK2}
    }`
  },
}
export const control_wait_until: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `while (!${args.inputs.CONDITION}) {
      yield null
    }`
  },
}
export const control_repeat_until: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `while (!${args.inputs.CONDITION}) {
      ${args.substacks.SUBSTACK}
      yield null
    }`
  },
}
export const control_stop: BlockImpl = {
  topLevel: false,
  generate(args) {
    const { STOP_OPTION } = args.fields
    switch(STOP_OPTION) {
      case 'all':
        return 'vmdata.runner.stop()'
      case 'this script':
        return 'return'
      case 'other scripts in sprite':
        return 'vmdata.runner.runningGenerators = vmdata.runner.runningGenerators.filter(thread => !(thread.targetId === vmdata.targetId && thread.generatorId !== vmdata.generatorId))'
    }
    return ''
  },
}
