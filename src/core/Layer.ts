export interface LayerConfig {
  name: string;
  zIndex: number
}

export class Layer {
  public readonly name: string
  public readonly canvas: HTMLCanvasElement
  public readonly ctx: CanvasRenderingContext2D

  private _visible = true
  private _opacity = 1
  private _locked = false
  private _blendMode: GlobalCompositeOperation = 'source-over'

  constructor(container: HTMLDivElement, config: LayerConfig) {
    this.name = config.name

    // création automatique du canvas
    const canvas = document.createElement('canvas')
    canvas.dataset.layer = this.name
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.zIndex = config.zIndex.toString()
    canvas.style.pointerEvents = 'none'
    canvas.style.backgroundColor =
        this.name === 'BACKGROUND'
            ? 'white'
            : 'transparent'

    container.appendChild(canvas)

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!

    this.resize(container)
  }

  // ----------------
  // resize
  // ----------------
  resize(container: HTMLDivElement) {
    const dpr = window.devicePixelRatio || 1
    const w = container.offsetWidth
    const h = container.offsetHeight
    this.canvas.width = w * dpr
    this.canvas.height = h * dpr
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'
    this.ctx.scale(dpr, dpr)
  }

  // ----------------
  // Visibility
  // ----------------

  set visible(v: boolean) {
    this._visible = v
    this.canvas.style.display = v ? 'block' : 'none'
  }

  get visible() {
    return this._visible
  }

  // ----------------
  // Opacity
  // ----------------

  set opacity(value: number) {
    this._opacity = Math.max(0, Math.min(1, value))
    this.canvas.style.opacity = this._opacity.toString()
  }

  get opacity() {
    return this._opacity
  }

  // ----------------
  // Lock
  // ----------------

  set locked(v: boolean) {
    this._locked = v
  }

  get locked() {
    return this._locked
  }

  // ----------------
  // Blend Mode
  // ----------------

  set blendMode(mode: GlobalCompositeOperation) {
    this._blendMode = mode
    this.canvas.style.mixBlendMode = mode
  }

  get blendMode() {
    return this._blendMode
  }

  // ----------------
  // Drawing helpers
  // ----------------

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  exportPNG(): string {
    return this.canvas.toDataURL('image/png')
  }
}

