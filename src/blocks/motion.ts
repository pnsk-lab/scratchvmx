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
export const motion_goto: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `
    switch(${args.inputs.TO}) {
      case '_random_':
        vmdata.target.x = vmdata.runner.width * Math.random() - vmdata.runner.width / 2
        vmdata.target.y = vmdata.runner.height * Math.random() - vmdata.runner.height / 2
        break
      case '_mouse_':
        vmdata.target.x = vmdata.runner.mouse.scratchX
        vmdata.target.y = vmdata.runner.mouse.scratchY
        break
      default:
        const {x, y} = vmdata.runner.getTargetFromName(${args.inputs.TO}) ?? {}
        if (x && y) {
          vmdata.target.x = x
          vmdata.target.y = y
        }
    }
    `
  },
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
export const motion_goto_menu: BlockImpl = {
  topLevel: false,
  generate(args) {
    return `"${args.fields.TO.replace('"', '\\"')}"`
  },
}
