import type { Block, Target } from '@pnsk-lab/sb3-types'
import { createBlocks } from '../blocks/mod.ts'
import type { BlockImpl, NormalBlockImpl } from '../blocks/types.ts'
import { CompileError } from './error.ts'

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

    if (!crrImpl) {
      throw new CompileError(`The block ${crrBlock.opcode} is not implmented.`)
    }

    // Generate Args
    const substacks: Record<string, string> = {}
    const inputs: Record<string, string> = {}
    const bindings: Record<string, string> = Object.fromEntries(Object.keys(crrImpl.bindings ?? {}).map(key => [key, `vmdata.blockImpls.${crrBlock.opcode}.bindings.${key}`]))

    for (const [key, value] of Object.entries(crrBlock.inputs ?? {})) {
      if (key.startsWith('SUBSTACK')) {
        const head = value[1].toString()
        const stop = crr
        substacks[key] = compileBlocks(head, blocks, stop)
      } else {
        if (value[0] === 1 || value[0] === 2) {
          const primitive = value[1]
          if (typeof primitive === 'string') {
            throw new CompileError('Block reference have not be used out of SUBSTACK.')
          }
          let input = 'null'
          switch (primitive[0]) {
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9: {
              // it's kind of numbers.
              input = primitive[1].toString() // It's static.
              break
            }
            case 10:
            case 11:
            case 12:
            case 13:
              throw new CompileError(`Primitive type ${primitive[0]} is not supported.`)
          }
          inputs[key] = input
        } else {
          throw new CompileError('Obscured primitive is not supported.')
        }
      }
    }

    body += crrImpl.generate({
      substacks,
      inputs,
      bindings,
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
    inputs: {},
    bindings: {},
    fn
  })
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
