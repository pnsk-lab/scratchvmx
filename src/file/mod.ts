/**
 * File Format
 * @module
 */

import type { ScratchProject } from '@pnsk-lab/sb3-types'
import type { Asset, Project } from '../types.ts'

export type FileTree = {
  [path: string]: Uint8Array
}

const decoder = new TextDecoder()

const processAsset = async (
  name: string,
  input: ArrayBuffer,
): Promise<Asset> => {
  const [assetId, ext] = name.split('.')

  switch (ext) {
    case 'svg':
      return {
        type: 'image',
        ext,
        svg: decoder.decode(input),
      }
    case 'png':
    case 'gif':
    case 'jpg':
      return {
        type: 'image',
        ext,
        image: await new Promise<HTMLImageElement>((resolve) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.src = URL.createObjectURL(
            new Blob([input], {
              type: 'image',
            }),
          )
        }),
      }
    case 'wav':
    case 'mp3':
      return {
        type: 'audio',
      }
    default:
      throw new Error(`ext .${ext} is not supported (filename: ${name}).`)
  }
}
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
    if (path === 'project.json') {
      continue
    }
    assets.set(name, await processAsset(path, data))
  }

  return {
    json: projectJSON,
    assets,
  }
}

export const loadJSON = async (json: ScratchProject): Promise<Project> => {
  const assetIds = new Set<string>()
  for (const target of json.targets) {
    for (const costume of target.costumes) {
      assetIds.add(`${costume.assetId}.${costume.dataFormat}`)
    }
    for (const sound of target.sounds) {
      assetIds.add(`${sound.assetId}.${sound.dataFormat}`)
    }
  }

  const assets = new Map(
    await Promise.all(
      [...assetIds].map(async (assetId): Promise<[string, Asset]> => [
        assetId.split('.')[0],
        await processAsset(
          assetId,
          await fetch(
            `https://cdn.assets.scratch.mit.edu/internalapi/asset/${assetId}/get/`,
          ).then((res) => res.arrayBuffer()),
        ),
      ]),
    ),
  )

  return {
    json,
    assets,
  }
}
