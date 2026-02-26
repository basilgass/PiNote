import type { Stroke } from '../types'

export class Layer {
  strokes: Stroke[] = []
  constructor(public id: string) {}

  addStroke(stroke: Stroke) {
    this.strokes.push(stroke)
  }

  clear() {
    this.strokes = []
  }
}