import type { Block, Target } from '@pnsk-lab/sb3-types'
import { createBlocks } from '../blocks/mod.ts'
import type { BlockImpl, NormalBlockImpl } from '../blocks/types.ts'
import { CompileError } from './error.ts'

const blockImpls = createBlocks()

export const compileBlock = (blockId: string, blocks: Target['blocks']) => {
  const block = blocks[blockId]
  if (!('opcode' in block)) {
    throw new CompileError('TopLevelPrimitive is not supported.')
  }

  const crrImpl = blockImpls[block.opcode] as NormalBlockImpl

  if (!crrImpl) {
    throw new CompileError(`The block ${block.opcode} is not implmented.`)
  }

  // Generate Args
  const substacks: Record<string, string> = {}
  const inputs: Record<string, string> = {}
  const fields: Record<string, string> = {}
  const bindings: Record<string, string> = Object.fromEntries(
    Object.keys(crrImpl.bindings ?? {}).map(
      (key) => [key, `vmdata.blockImpls.${block.opcode}.bindings.${key}`],
    ),
  )

  for (const [key, value] of Object.entries(block.inputs ?? {})) {
    if (key.startsWith('SUBSTACK')) {
      const head = value[1].toString()
      const stop = blockId
      substacks[key] = compileBlocks(head, blocks, stop)
    } else {
      if (value[0] !== 1 && value[0] !== 2) {
        throw new CompileError('Obscured primitive is not supported.')
      }

      let input = 'null'

      const primitive = value[1]
      if (typeof primitive === 'string') {
        // Block
        input = compileBlock(primitive, blocks)
      } else {
        // Literal
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
            throw new CompileError(
              `Primitive type ${primitive[0]} is not supported.`,
            )
        }
      }
      inputs[key] = input
    }
  }
  for (const [key, [value, value2]] of Object.entries(block.fields ?? {})) {
    fields[key] = value
    if (value2) {
      throw new CompileError('I don\t know all of fields! Pleace teach me!')
    }
  }

  return crrImpl.generate({
    inputs,
    fields,
    substacks,
    bindings,
  })
}

const compileBlocks = (
  head: string,
  blocks: Target['blocks'],
  stop?: string,
) => {
  let crr = head

  let body = ''
  while (true) {
    const crrBlock = blocks[crr]
    if (crr === stop) {
      break
    }

    body += compileBlock(crr, blocks) + '\n'

    const next = (crrBlock as Block).next
    if (!next) {
      break
    }
    crr = next
  }

  return body
}
const compileTopLevel = (topLevel: Block, blocks: Target['blocks']) => {
  const topLevelBlockImpl = blockImpls[topLevel.opcode]

  const next = topLevel.next
  if (!next) {
    return ''
  }
  const fn = `async function * () { ${
    compileBlocks(next, blocks)
  }; yield null }`

  return topLevelBlockImpl.generate({
    inputs: {},
    fields: {},
    substacks: {},
    bindings: {},
    fn,
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
