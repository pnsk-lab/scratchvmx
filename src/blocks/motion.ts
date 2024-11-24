import type { BlockImpl } from './types.ts'
import type { VMData } from '../runner/types.ts'

export const motion_movesteps: BlockImpl = {
  topLevel: false,
  generate(args) {
    const step = args.inputs.STEPS
    return `{
      const step = ${step}
      const radians = (90 - vmdata.target.direction) * (Math.PI / 180)
      vmdata.target.x += step * Math.cos(radians)
      vmdata.target.y += step * Math.sin(radians)
    }`
  },
}

export const motion_turnright: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `vmdata.target.direction+=${args.inputs.DEGREES};`
  },
}
export const motion_turnleft: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `vmdata.target.direction-=${args.inputs.DEGREES};`
  },
}
export const motion_ifonedgebounce: BlockImpl<'proc'> = {
  topLevel: false,
  generate(args) {
    return `${args.bindings.proc}(vmdata);`
  },
  bindings: {
    proc(vmdata: VMData) {
      const stageWidth = vmdata.runner.width
      const stageHeight = vmdata.runner.height
      const bounds = vmdata.target.getBounds()

      const distLeft = Math.max(0, (stageWidth / 2) + bounds.left)
      const distTop = Math.max(0, (stageHeight / 2) - bounds.top)
      const distRight = Math.max(0, (stageWidth / 2) - bounds.right)
      const distBottom = Math.max(0, (stageHeight / 2) + bounds.bottom)

      let nearestEdge: 'left' | 'top' | 'right' | 'bottom' = 'left'
      let minDist = Infinity
      if (distLeft < minDist) {
        minDist = distLeft
        nearestEdge = 'left'
      }
      if (distTop < minDist) {
        minDist = distTop
        nearestEdge = 'top'
      }
      if (distRight < minDist) {
        minDist = distRight
        nearestEdge = 'right'
      }
      if (distBottom < minDist) {
        minDist = distBottom
        nearestEdge = 'bottom'
      }

      if (minDist > 0) {
        return // Sprite doesn't touch edges.
      }

      const rad = (90 - vmdata.target.direction) * (Math.PI / 180)
      let dx = Math.cos(rad)
      let dy = -Math.sin(rad)

      switch (nearestEdge) {
        case 'left':
          dx = Math.max(0.2, Math.abs(dx))
          break
        case 'top':
          dy = Math.max(0.2, Math.abs(dy))
          break
        case 'right':
          dx = -Math.max(0.2, Math.abs(dx))
          break
        case 'bottom':
          dy = 0 - Math.max(0.2, Math.abs(dy))
          break
      }

      vmdata.target.direction = (Math.atan2(dy, dx)) / (Math.PI / 180) + 90
    },
  },
}

const getTargetXY = (target: string, vmdata: VMData) => {
  switch (target) {
    case '_random_':
      return [
        vmdata.runner.width * Math.random() - vmdata.runner.width / 2,
        vmdata.runner.height * Math.random() - vmdata.runner.height / 2
      ]
    case '_mouse_':
      return [
        vmdata.runner.mouse.scratchX,
        vmdata.runner.mouse.scratchY
      ]
    default: {
      const { x, y } = vmdata.runner.getTargetFromName(target) ?? {}
      return [
        x ?? 0,
        y ?? 0
      ]
    }
  }
}
export const motion_goto: BlockImpl<'getTargetXY'> = {
  topLevel: false,
  generate(args) {
    return `
    {
    const [x, y] = ${args.bindings.getTargetXY}(${args.inputs.TO}, vmdata)
    vmdata.target.x = x
    vmdata.target.y = y
    }
    `
  },
  bindings: {
    getTargetXY
  }
}
export const motion_gotoxy: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `
      vmdata.target.x = ${args.inputs.X}
      vmdata.target.y = ${args.inputs.Y}
    `
  },
}

export const motion_pointtowards: BlockImpl<'getTargetXY'> = {
  topLevel: false,
  generate(args) {
    console.log(args)
    return `{
      const [x, y] = ${args.bindings.getTargetXY}(${args.inputs.TOWARDS}, vmdata)
      vmdata.target.direction = 360 - (Math.atan2(vmdata.target.y - y, vmdata.target.x - x) * 180 / Math.PI) - 90
    }`
  },
  bindings: {
    getTargetXY
  }
}
export const motion_pointindirection: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `vmdata.target.direction=${args.inputs.DIRECTION};`
  },
}
export const motion_goto_menu: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `"${args.fields.TO.replace('"', '\\"')}"`
  },
}
export const motion_pointtowards_menu: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `"${args.fields.TOWARDS.replace('"', '\\"')}"`
  },
}
export const motion_changexby: BlockImpl = {
  topLevel: false,
  generate: (args) => `vmdata.target.x += ${args.inputs.DX}`
}
export const motion_changeyby: BlockImpl = {
  topLevel: false,
  generate: (args) => `vmdata.target.y += ${args.inputs.DY}`
}
export const motion_setx: BlockImpl = {
  topLevel: false,
  generate: (args) => `vmdata.target.x = ${args.inputs.X}`
}
export const motion_sety: BlockImpl = {
  topLevel: false,
  generate: (args) => `vmdata.target.y = ${args.inputs.Y}`
}
export const motion_xposition: BlockImpl = {
  topLevel: false,
  generate: () => `vmdata.target.x`
}
export const motion_yposition: BlockImpl = {
  topLevel: false,
  generate: () => `vmdata.target.y`
}
export const motion_direction: BlockImpl = {
  topLevel: false,
  generate: () => `vmdata.target.direction`
}
