export type StrokePoint = {
  x: number
  y: number
  t: number
}

export type ToolType =
  | 'pen'
  | 'eraser'
  | 'marker'
  | 'brush'
  | 'highlighter'
  | 'line'
  | 'rect'
  | 'circle'