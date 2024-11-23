/**
 * File Format
 * @module
 */

import type { ScratchProject } from '@pnsk-lab/sb3-types'
import type { Project } from "../types.ts";

export type FileTree = {
  [path: string]: Uint8Array
}

const decoder = new TextDecoder()
/**
 * Load .sb3 format
 * @param fileTree Unzipped .sb3 file tree
 */
export const loadSb3 = (fileTree: FileTree): Project => {
  const projectJSON: ScratchProject = JSON.parse(decoder.decode(fileTree['project.json']))

  return {
    json: projectJSON
  }
}
