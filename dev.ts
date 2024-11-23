import { loadSb3 } from './src/file/mod.ts'
import { unzipSync } from 'fflate'
import { Runner } from './src/mod.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const buff = await fetch('/project.sb3').then((res) => res.arrayBuffer())
const fileTree = unzipSync(new Uint8Array(buff))

const project = await loadSb3(fileTree)
const runner = new Runner({
  canvas,
  project,
})
runner.start()
