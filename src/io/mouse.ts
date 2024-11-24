export interface MouseInit {
  width: number
  height: number
  canvas: HTMLCanvasElement
}

export class Mouse {
  #box: DOMRect
  #resizeObserver: ResizeObserver
  #canvas: HTMLCanvasElement

  #width: number
  #height: number

  constructor(init: MouseInit) {
    this.#width = init.width
    this.#height = init.height

    this.#canvas = init.canvas
    this.#resizeObserver = new ResizeObserver(this.#resize)
    this.#resizeObserver.observe(this.#canvas)
    this.#box = init.canvas.getBoundingClientRect()

    document.addEventListener('resize', this.#resize)
    document.addEventListener('scroll', this.#resize)

    document.addEventListener('pointerdown', this.#pointerDown)
    document.addEventListener('pointermove', this.#pointerMove)
    document.addEventListener('pointerup', this.#pointerUp)
  }

  #primaryPointer: {
    downed: boolean
    clientX: number
    clientY: number
  } = {
    downed: false,
    clientX: 0,
    clientY: 0,
  }
  #pointerDown = (evt: PointerEvent) => {
    if (evt.isPrimary) {
      this.#primaryPointer = {
        downed: true,
        clientX: evt.clientX,
        clientY: evt.clientY,
      }
    }
  }
  #pointerMove = (evt: PointerEvent) => {
    if (evt.isPrimary) {
      this.#primaryPointer.clientX = evt.clientX
      this.#primaryPointer.clientY = evt.clientY
    }
  }
  #pointerUp = (evt: PointerEvent) => {
    if (evt.isPrimary) {
      this.#primaryPointer = {
        downed: true,
        clientX: evt.clientX,
        clientY: evt.clientY,
      }
    }
  }

  get scratchX(): number {
    return Math.min(
      this.#width / 2,
      Math.max(
        this.#width / -2,
        (this.#primaryPointer.clientX - this.#box.left) *
            (this.#width / this.#box.width) - this.#width / 2,
      ),
    )
  }
  get scratchY(): number {
    return Math.min(
      this.#height / 2,
      Math.max(
        this.#height / -2,
        -((this.#primaryPointer.clientY - this.#box.top) *
            (this.#height / this.#box.height) - this.#height / 2),
      ),
    )
  }

  #resize = () => {
    this.#box = this.#canvas.getBoundingClientRect()
  }

  unmount() {
    this.#resizeObserver.unobserve(this.#canvas)
    document.removeEventListener('resize', this.#resize)
    document.removeEventListener('scroll', this.#resize)

    document.removeEventListener('pointerdown', this.#pointerDown)
    document.removeEventListener('pointermove', this.#pointerMove)
    document.removeEventListener('pointerup', this.#pointerUp)
  }
}
