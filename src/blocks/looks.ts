import { waitForSec } from './shared/time.ts'
import { BlockImpl } from './types.ts'

export const looks_say: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `vmdata.target.bubble.say(String(${args.inputs.MESSAGE}))`
  },
}
export const looks_sayforsecs: BlockImpl<'waitForSec'> = {
  topLevel: false,
  generate: (args) =>
    `vmdata.target.bubble.say(String(${args.inputs.MESSAGE}));for await (const _ of ${args.bindings.waitForSec}(${args.inputs.SECS})){yield _};vmdata.target.bubble.say('')`,
  bindings: { waitForSec },
}

export const looks_think: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `vmdata.target.bubble.think(String(${args.inputs.MESSAGE}))`
  },
}
export const looks_thinkforsecs: BlockImpl<'waitForSec'> = {
  topLevel: false,
  generate: (args) =>
    `vmdata.target.bubble.think(String(${args.inputs.MESSAGE}));for await (const _ of ${args.bindings.waitForSec}(${args.inputs.SECS})){yield _};vmdata.target.bubble.think('')`,
  bindings: { waitForSec },
}

export const looks_switchcostumeto: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `vmdata.target.costume=vmdata.target.costumes.findIndex(c => c.name === ${args.inputs.COSTUME})`
  },
}
export const looks_costume: BlockImpl = {
  topLevel: false,
  generate: ({ fields }) => `"${fields.COSTUME.replaceAll('"', '\\"')}"`,
}
export const looks_nextcostume: BlockImpl = {
  topLevel: false,
  generate() {
    return `vmdata.target.costume = (vmdata.target.costume+1)%vmdata.target.costumes.length;`
  },
}

export const looks_switchbackdropto: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `{
      const target = ${args.inputs.BACKDROP}
      console.log(target)
      let i
      switch (target) {
        case 'next backdrop':
          i = (vmdata.runner.stage.costume+1)%vmdata.runner.stage.costumes.length
          break
        case 'previous backdrop':
          i = (vmdata.runner.stage.costume-1)%vmdata.runner.stage.costumes.length
          if (i < 0) {
            i = (i + vmdata.runner.stage.costumes.length) % vmdata.runner.stage.costumes.length
          }
          break
        case 'random backdrop':
          i = Math.floor(vmdata.runner.stage.costumes.length * Math.random())
          break
        default:
          i = vmdata.runner.stage.costumes.findIndex(c=>c.name===${args.inputs.BACKDROP})
          break
      }
      if (i !== -1) {
        vmdata.runner.stage.costume = i
      }
    }`
  },
}
export const looks_backdrops: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `"${args.fields.BACKDROP.replaceAll('"', '\\"')}"`
  },
}

export const looks_setsizeto: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `vmdata.target.scale = ${args.inputs.SIZE}`
  },
}
export const looks_changesizeby: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `vmdata.target.scale += ${args.inputs.CHANGE}`
  },
}
export const looks_seteffectto: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `vmdata.target.effects.set("${
      args.fields.EFFECT.toLowerCase().replace('"', '\\"')
    }", ${args.inputs.VALUE})`
  },
}
export const looks_changeeffectby: BlockImpl = {
  topLevel: false,
  generate(args) {
    const effectLiteral = `"${
      args.fields.EFFECT.toLowerCase().replace('"', '\\"')
    }"`
    return `vmdata.target.effects.set(${effectLiteral}, vmdata.target.effects.get(${effectLiteral}) + ${args.inputs.CHANGE})`
  },
}
export const looks_cleargraphiceffects: BlockImpl = {
  topLevel: false,
  generate: () => `vmdata.target.effects.clear()`,
}
export const looks_hide: BlockImpl = {
  topLevel: false,
  generate: () => `vmdata.target.isHidden = true`,
}
export const looks_show: BlockImpl = {
  topLevel: false,
  generate: () => `vmdata.target.isHidden = false`,
}

export const looks_gotofrontback: BlockImpl = {
  topLevel: false,
  generate: (args) =>
    `vmdata.target.changeOrder(${
      args.fields.FRONT_BACK === 'back' ? '-Infinity' : 'Infinity'
    })`,
}
export const looks_goforwardbackwardlayers: BlockImpl = {
  topLevel: false,
  generate: (args) =>
    `vmdata.target.changeOrder(${
      args.fields.FORWARD_BACKWARD === 'forward' ? '1' : '-1'
    } * ${args.inputs.NUM}, true)`,
}
export const looks_costumenumbername: BlockImpl = {
  topLevel: false,
  generate: (args) =>
    args.fields.NUMBER_NAME === 'number'
      ? 'vmdata.target.costume+1'
      : 'vmdata.target.costumes[vmdata.target.costume].name',
}
export const looks_backdropnumbername: BlockImpl = {
  topLevel: false,
  generate: (args) =>
    args.fields.NUMBER_NAME === 'number'
      ? 'vmdata.runner.stage.costume+1'
      : 'vmdata.runner.stage.costumes[vmdata.runner.stage.costume].name',
}
export const looks_size: BlockImpl = {
  topLevel: false,
  generate: () => 'vmdata.target.scale',
}
