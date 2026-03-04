import {describe, expect, it} from 'vitest'
import {Stroke} from '../src/types/stroke'
import {Engine} from '../src/core/Engine'

describe('Engine', () => {
  it('should add and replay shapes', () => {
    const engine = new Engine()
    const s: Stroke = {
      id: '1',
      layerId: 'default',
      color: '#000',
      width: 2,
      tool: 'pen',
      points: [{ x: 0, y: 0, t: 0 }, { x: 1, y: 1, t: 10 }],
      createdAt: 5
    }
    engine.startStroke('default', s)
    expect(engine.replay(4)).toHaveLength(0)
    expect(engine.replay(6)).toHaveLength(1)
  })
})