import type { Sprite, Stage } from '@pnsk-lab/sb3-types'
import { Runner } from '../mod.ts'
import type { Render } from '../renderer.ts'
import { SPRITE_LAYER, STAGE_LAYER } from './constants.ts'
import { throws } from 'assert'

interface RunnerTargetInit {
  runner: Runner
  target: Sprite | Stage

  isClone: boolean

  x?: number
  y?: number
  scale?: number
  direction?: number
  costume?: number
}

class Bubble {
  #renderer: Render
  #renderIds: {
    drawable: number
    skin: number
  } | null = null
  #target: RunnerTarget
  #runner: Runner

  #isBubbleRight = false
  #text: string = ''
  #type: 'say' | 'think' | null = null

  constructor(target: RunnerTarget, runner: Runner) {
    this.#renderer = runner.renderer
    this.#target = target
    this.#runner = runner
  }

  #do(type: 'say' | 'think', text: string) {
    this.#type = type
    this.#text = text
    if (text === '') {
      this.#renderer.updateTextSkin(
        this.#renderIds?.skin,
        type,
        '',
        this.#isBubbleRight,
      )
      this.#renderer.updateDrawableVisible(this.#renderIds?.drawable, false)
      return
    }
    this.#renderer.updateDrawableVisible(this.#renderIds?.drawable, true)
    if (!this.#renderIds) {
      const drawable = this.#renderer.createDrawable(SPRITE_LAYER)
      const skin = this.#renderer.createTextSkin(
        type,
        text,
        this.#isBubbleRight,
      )
      this.#renderer.updateDrawableSkinId(drawable, skin)
      this.#renderIds = {
        drawable,
        skin,
      }
    }

    this.render()
  }
  say(text: string) {
    this.#do('say', text)
  }
  think(text: string) {
    this.#do('think', text)
  }
  render() {
    if (this.#text === '') {
      return
    }

    const bounds = this.#renderer.getBounds(this.#renderIds?.drawable)

    let x = this.#target.x - 40
    let y = this.#target.y + 50

    if (this.#isBubbleRight) {
      x += 40
    } else {
      x -= 30
    }

    const rightEdgeX = this.#runner.width / 2
    const leftEdgeX = this.#runner.width / -2

    if (rightEdgeX <= bounds.right) {
      this.#isBubbleRight = false
    } else if (bounds.left - 10 <= leftEdgeX) {
      this.#isBubbleRight = true
    }
    this.#renderer.updateTextSkin(
      this.#renderIds?.skin,
      this.#type,
      this.#text,
      this.#isBubbleRight,
    )

    x = Math.max(Math.min(x, rightEdgeX - bounds.width), leftEdgeX)
    y = Math.max(
      Math.min(y, this.#runner.height / 2),
      this.#runner.height / -2 + bounds.height,
    )

    if (this.#renderIds) {
      this.#renderer.updateDrawablePosition(this.#renderIds.drawable, [x, y])
    }
  }
}

class Effects {
  #target: RunnerTarget
  #renderer: Render
  constructor(target: RunnerTarget, renderer: Render) {
    this.#target = target
    this.#renderer = renderer
  }
  #effects = new Map<string, number>()
  get(name: string) {
    return this.#effects.get(name) ?? 0
  }
  set(name: string, value: number) {
    this.#effects.set(name, value)
    this.#renderer.updateDrawableEffect(this.#target.drawableId, name, value)
  }
  clear() {
    for (const [k] of this.#effects) {
      this.set(k, 0)
    }
  }
}

export class RunnerTarget {
  drawableId: number
  readonly costumes: {
    name: string
    skinId: number
  }[]

  readonly name: string

  // Runner data
  x: number
  y: number
  direction: number
  costume: number
  #scale: number
  get scale() {
    return this.#scale
  }
  set scale(v: number) {
    this.#scale = Math.min(1000, Math.max(v, 0))
  }
  rotationStyle: 'all around' | 'left-right' | "don't rocate"
  isHidden: boolean

  readonly bubble: Bubble
  #renderer: Render
  #target: Sprite | Stage
  #runner: Runner

  readonly isStage: boolean

  effects: Effects

  constructor(init: RunnerTargetInit) {
    this.#renderer = init.runner.renderer
    this.drawableId = init.runner.renderer.createDrawable(
      init.target.isStage ? STAGE_LAYER : SPRITE_LAYER,
    )
    this.#target = init.target
    this.#runner = init.runner
    this.name = init.target.name
    this.effects = new Effects(this, this.#renderer)
    this.rotationStyle = 'all around'
    this.isStage = init.target.isStage
    this.isHidden = false

    this.bubble = new Bubble(this, this.#runner)

    this.x = init.x ?? 0
    this.y = init.y ?? 0
    this.direction = init.direction ?? 90
    this.costume = init.costume ?? 0
    this.#scale = init.scale ?? 100

    this.costumes = init.target.costumes.flatMap((costume) => {
      const asset = init.runner.project.assets.get(costume.assetId)
      if (!asset) {
        return []
      }
      if (asset.type !== 'image') {
        return []
      }
      const skinId = asset.ext === 'svg'
        ? this.#renderer.createSVGSkin(asset.svg)
        : init.runner.renderer.createBitmapSkin(asset.image)
      return [{
        name: costume.name,
        skinId,
      }]
    })
    this.#renderer.updateDrawableSkinId(
      this.drawableId,
      this.costumes[this.costume].skinId,
    )
  }

  createClone() {
    if (this.#target.isStage) {
      // Stages can't create clones.
      return
    }
    const clone = new RunnerTarget({
      isClone: true,
      runner: this.#runner,
      target: this.#target,
      costume: this.costume,
      direction: this.direction,
      x: this.x,
      y: this.y,
      scale: this.scale
    })
    this.#runner.createTarget(clone)
    console.log('clone')
  }

  getBounds() {
    return this.#renderer.getBounds(this.drawableId)
  }

  changeOrder(order: number, isDelta?: boolean) {
    if (this.isStage) {
      return
    }
    this.#renderer.setDrawableOrder(
      this.drawableId,
      order,
      SPRITE_LAYER,
      isDelta,
    )
  }

  render() {
    // Render position
    this.#renderer.updateDrawablePosition(this.drawableId, [
      this.x,
      this.y,
    ])

    // Render direction and scale
    this.direction = this.direction % 360
    if (this.direction > 180) {
      this.direction = -(360 - this.direction)
    }
    let resultDirection = this.direction
    const resultScale = [this.scale, this.scale]

    switch (this.rotationStyle) {
      case 'all around':
        break
      case 'left-right':
        if (resultDirection < 0) {
          resultDirection = 90
          resultScale[0] *= -1
        }
        resultDirection = 90
        break
      case "don't rocate":
        resultDirection = 90
    }
    this.#renderer.updateDrawableDirectionScale(
      this.drawableId,
      resultDirection,
      // @ts-expect-error Turbowarp types bug
      resultScale,
    )

    this.#renderer.updateDrawableSkinId(
      this.drawableId,
      this.costumes[this.costume].skinId,
    )
    this.#renderer.updateDrawableVisible(this.drawableId, !this.isHidden)

    this.bubble.render()
  }
}
