import { loadJSON, loadSb3 } from './src/file/mod.ts'
import { unzipSync } from 'fflate'
import { Runner } from './src/mod.ts'
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'
import type { ScratchProject } from '@pnsk-lab/sb3-types'
import type { Project } from './src/types.ts'
import { CompileError } from './src/compiler/error.ts'

const $state = document.getElementById('state') as HTMLDivElement
const $projectID = document.getElementById('projectID') as HTMLInputElement
const $load = document.getElementById('load') as HTMLDivElement
const canvas = document.getElementById('canvas') as HTMLCanvasElement

$load.onclick = async () => {
  $state.textContent = 'Downloading project...'

  const projectMeta = await fetch(`https://trampoline.turbowarp.org/proxy/projects/${$projectID.value}`).then(res => res.json())
  if (projectMeta.error) {
    $state.textContent = `Load error: ${projectMeta.error}`
    return
  }
  const buff = new Uint8Array(await fetch(`https://projects.scratch.mit.edu/${$projectID.value}?token=${projectMeta.project_token}`)
    .then(res => res.arrayBuffer()) satisfies ArrayBuffer)
  
  let json: ScratchProject | null
  try {
    json = JSON.parse(new TextDecoder().decode(buff))
  } catch {
    json = null
  }

  await loadFromBufferOrJSON(json ?? buff)
  location.hash = `#${$projectID.value}`
}

$state.innerHTML = 'Downloading default sb3...'
const buff = await fetch('/project.sb3').then((res) => res.arrayBuffer())

const loadFromBufferOrJSON = async (sb3: ArrayBuffer | ScratchProject | Uint8Array) => {
  let project: Project
  if (sb3 instanceof ArrayBuffer || sb3 instanceof Uint8Array) {
    $state.textContent = 'Unzipping sb3...'
    const fileTree = unzipSync(new Uint8Array(sb3))

    $state.textContent = 'Loading sb3...'
    project = await loadSb3(fileTree)
  } else {
    $state.textContent = 'Loading assets...'
    project = await loadJSON(sb3)
  }

  $state.textContent = 'Compileing project...'

  let runner: Runner
  try {
    runner = new Runner({
      canvas,
      project,
    })
  } catch (error) {
    console.log(error)
    if (error instanceof CompileError) {
      $state.textContent = `${error.name}: ${error.message}`
    }
    throw error
  }
  $state.textContent = 'Starting!'
  runner.start()
}

const defaultProjectID = location.hash.slice(1)
if (defaultProjectID) {
  $projectID.value = defaultProjectID
  $load.click()
}
loadFromBufferOrJSON(buff)
