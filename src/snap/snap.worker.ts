/// <reference lib="webworker" />
import { SpatialIndex } from '../core/SpatialIndex'
import { GridSnap } from './strategies/GridSnap'
import { MidpointSnap } from './strategies/MidpointSnap'
import { PointSnap } from './strategies/PointSnap'
import type { SnapCandidate, Segment, CircleGeom } from '../shapes/GeometryTypes'
import type { SnapResult } from './SnapResult'

interface SnapRequest {
    id: number
    x: number
    y: number
    snapRadius: number
    gridEnabled: boolean
    gridSize: number
    activeLayer: string | null
    points: SnapCandidate[]
    segments: Segment[]
    circles: CircleGeom[]
}

self.onmessage = ({ data }: MessageEvent<SnapRequest>) => {
    const { id, x, y, snapRadius, gridEnabled, gridSize, activeLayer, points, segments, circles } = data

    const index = new SpatialIndex(100)
    for (const p of points) index.insertSnapPoint(p)
    for (const s of segments) index.insertSegment(s)
    for (const c of circles) index.insertCircle(c)

    const strategies = [
        new GridSnap({ gridSize, enabled: gridEnabled, priority: 10 }),
        new MidpointSnap(),
        new PointSnap(),
    ]

    let best: SnapResult | null = null

    for (const strategy of strategies) {
        if (!strategy.enabled) continue
        const result = strategy.snap({ x, y, index, snapRadius, activeLayer })
        if (!result) continue
        if (!best || (result.priority ?? 0) > (best.priority ?? 0)) best = result
    }

    ;(self as DedicatedWorkerGlobalScope).postMessage({ id, result: best })
}
