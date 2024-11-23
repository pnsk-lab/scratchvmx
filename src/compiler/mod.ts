import type { Block, Target } from '@pnsk-lab/sb3-types'
import { createBlocks } from '../blocks/mod.ts'
import type { BlockImpl, NormalBlockImpl } from '../blocks/types.ts'

const blockImpls = createBlocks()

const compileBlocks = (
  head: string,
  blocks: Target['blocks'],
  stop?: string,
) => {
  let crr = head

  let body = ''
  while (true) {
    const crrBlock = blocks[crr]
    if (!('opcode' in crrBlock)) {
      break
    }
    if (crr === stop) {
      break
    }

    const crrImpl = blockImpls[crrBlock.opcode] as NormalBlockImpl

    // Generate Substack
    const substacks: Record<string, string> = {}
    for (const [key, value] of Object.entries(crrBlock.inputs ?? {})) {
      if (key.startsWith('SUBSTACK')) {
        const head = value[1].toString()
        const stop = crr
        substacks[key] = compileBlocks(head, blocks, stop)
      }
    }

    body += crrImpl.generate({
      substacks,
    }) + `\n`

    if (!crrBlock.next) {
      break
    }
    crr = crrBlock.next
  }

  return body
}
const compileTopLevel = (topLevel: Block, blocks: Target['blocks']) => {
  const topLevelBlockImpl = blockImpls[topLevel.opcode]

  const next = topLevel.next
  if (!next) {
    return ''
  }
  const fn = `async function * () { ${compileBlocks(next, blocks)} }`

  return topLevelBlockImpl.generate({
    substacks: {},
  }, fn)
}

export const compile = (blocks: Target['blocks']) => {
  const codes: string[] = []
  for (const block of Object.values(blocks)) {
    if (!('opcode' in block)) {
      continue
    }
    if (block.topLevel) {
      codes.push(compileTopLevel(block, blocks))
    }
  }
  return codes
}
