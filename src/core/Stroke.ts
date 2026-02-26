import type { StrokePoint, ToolType  } from '../types'

export type StrokeOptions = {
  id: string
  layerId: string
  color: string
  width: number
  tool: ToolType
  createdAt: number
}

export class Stroke {
  readonly id: string
  readonly layerId: string
  readonly color: string
  readonly width: number
  readonly tool: ToolType
  readonly createdAt: number

  private _points: StrokePoint [] = []

  constructor(options: StrokeOptions) {
    this.id = options.id
    this.layerId = options.layerId
    this.color = options.color
    this.width = options.width
    this.tool = options.tool
    this.createdAt = options.createdAt
  }

  addPoint(point: StrokePoint ) {
    this._points.push(point)
  }

  get points(): StrokePoint [] {
    return this._points
  }

  getPointsUntil(time: number): StrokePoint [] {
    return this._points.filter(p => p.t <= time)
  }

  isEmpty(): boolean {
    return this._points.length === 0
  }
}