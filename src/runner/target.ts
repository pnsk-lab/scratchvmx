import type { Sprite, Stage } from '@pnsk-lab/sb3-types'
import type { Runner } from '../mod.ts'
import type { Render } from '../renderer.ts'

interface RunnerTargetInit {
  runner: Runner
  target: Sprite | Stage
}

export class RunnerTarget {
  #drawableId: number
  #skinIds: Map<string, number>

  #position: {
    x: number
    y: number
  } = {
    x: 0,
    y: 0
  }

  #renderer: Render

  constructor(init: RunnerTargetInit) {
    this.#renderer = init.runner.renderer
    this.#drawableId = init.runner.renderer.createDrawable(init.target.name)

    this.#skinIds = new Map(init.target.costumes.flatMap((costume) => {
      const asset = init.runner.project.assets.get(costume.assetId)
      if (!asset) {
        return []
      }
      if (asset.type !== 'image') {
        return []
      }
      const skinId = asset.ext === 'svg' ? init.runner.renderer.createSVGSkin(asset.svg) : init.runner.renderer.createBitmapSkin(asset.image)
      return [[costume.assetId, skinId]]
    }))

    this.setXY(0, 0)
    this.#renderer.updateDrawableSkinId(this.#drawableId, [...this.#skinIds][0][1])
  }

  setXY(x: number, y: number) {
    this.#position.x = x
    this.#position.y = y
    this.#renderer.updateDrawablePosition(this.#drawableId, [
      this.#position.x,
      this.#position.y
    ])
  }

}
