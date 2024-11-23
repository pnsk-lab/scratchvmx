import type { ScratchProject } from '@pnsk-lab/sb3-types'

export interface Project {
  json: ScratchProject
  assets: Map<string, Asset>
}

export type Asset = {
  type: 'image'
  ext: 'svg'
  svg: string
} | {
  type: 'image'
  ext: 'png' | 'jpg'
  image: HTMLImageElement
}
