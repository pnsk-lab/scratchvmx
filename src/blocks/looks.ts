import { BlockImpl } from './types.ts'

export const looks_nextcostume: BlockImpl = {
  topLevel: false,
  generate() {
    return `vmdata.target.costume = (vmdata.target.costume+1)%vmdata.target.costumes.length;`
  },
}
