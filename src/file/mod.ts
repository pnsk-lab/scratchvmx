/**
 * File Format
 * @module
 */

import type { ScratchProject } from '@pnsk-lab/sb3-types'
import type { Project, Asset } from '../types.ts'

export type FileTree = {
  [path: string]: Uint8Array
}

const decoder = new TextDecoder()

/**
 * Load .sb3 format
 * @param fileTree Unzipped .sb3 file tree
 */
export const loadSb3 = async (fileTree: FileTree): Promise<Project> => {
  const projectJSON: ScratchProject = JSON.parse(
    decoder.decode(fileTree['project.json']),
  )

  const assets = new Map<string, Asset>()

  for (const [path, data] of Object.entries(fileTree)) {
    const name = path.slice(0, -4)
    if (path.endsWith('.svg')) {
      assets.set(name, {
        type: 'image',
        ext: 'svg',
        svg: decoder.decode(data)
      })
      continue
    }
    if (path.endsWith('.png')) {
      const image = await new Promise<HTMLImageElement>(resolve => {
        const image = new Image()
        image.src = URL.createObjectURL(new Blob([data], {
          type: 'image'
        }))
        image.onload = () => resolve(image)
      })
      assets.set(name, {
        type: 'image',
        ext: path.split('.').at(-1) as 'png',
        image
      })
    }
  }

  return {
    json: projectJSON,
    assets
  }
}
