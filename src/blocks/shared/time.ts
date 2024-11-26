export const waitForSec = async function* (sec: number) {
  const finishTime = Date.now() + sec * 1000
  while (true) {
    if (finishTime <= Date.now()) {
      break
    }
    yield null
  }
}
