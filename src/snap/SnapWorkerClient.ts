import type {SnapResult} from './SnapResult'
import type {CircleGeom, Segment, SnapCandidate} from '../shapes/GeometryTypes'
import type {Adaptable} from '../shapes/Adaptable'
import SnapWorkerConstructor from './snap.worker?worker'

export interface SnapGeometry {
    points: SnapCandidate[]
    segments: Segment[]
    circles: CircleGeom[]
}

interface WorkerConfig {
    snapRadius: number
    gridEnabled: boolean
    gridSize: number
    activeLayer: string | null
}

export class SnapWorkerClient {
    private worker: Worker
    private _latestId = -1
    private _nextId = 0
    private _onResult: ((result: SnapResult | null) => void) | null = null

    constructor() {
        this.worker = new SnapWorkerConstructor()
        this.worker.onmessage = ({ data }: MessageEvent<{ id: number; result: SnapResult | null }>) => {
            if (data.id === this._latestId) {
                this._onResult?.(data.result)
            }
        }
    }

    request(
        x: number,
        y: number,
        geometry: SnapGeometry,
        config: WorkerConfig,
        onResult: (result: SnapResult | null) => void
    ): void {
        const id = this._nextId++
        this._latestId = id
        this._onResult = onResult
        this.worker.postMessage({ id, x, y, ...config, ...geometry })
    }

    static buildGeometry(shapes: readonly Adaptable[]): SnapGeometry {
        const points: SnapCandidate[] = []
        const segments: Segment[] = []
        const circles: CircleGeom[] = []
        for (const shape of shapes) {
            shape.getSnapPoints().forEach(p => points.push(p))
            shape.getSegments().forEach(s => segments.push(s))
            shape.getCircles().forEach(c => circles.push(c))
        }
        return { points, segments, circles }
    }

    destroy(): void {
        this.worker.terminate()
    }
}
