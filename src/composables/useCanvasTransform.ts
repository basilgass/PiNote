import {computed, onMounted, onUnmounted, shallowReactive} from 'vue'
import type {Ref} from 'vue'
import type {Bounds} from '../shapes/GeometryTypes'

export interface CanvasTransform {
    x: number
    y: number
    scale: number
}

export interface UseCanvasTransformOptions {
    panButton?: 0 | 1 | 2     // bouton souris pour le pan (défaut: 0 = clic gauche)
    onTransformChange?: () => void
    canPan?: () => boolean     // si fourni, le pan 1 doigt n'est actif que si retourne true
}

export function useCanvasTransform<T extends HTMLElement>(
    targetRef: Ref<T | null>,
    options: UseCanvasTransformOptions = {}
) {
    const {panButton = 0, onTransformChange, canPan} = options

    const MIN_SCALE = 0.1
    const MAX_SCALE = 10
    const ZOOM_STEP = 0.15

    const transform = shallowReactive<CanvasTransform>({x: 0, y: 0, scale: 1})

    const cssTransform = computed(
        () => `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
    )

    function notify() {
        onTransformChange?.()
    }

    function clamp(v: number, min: number, max: number) {
        return Math.max(min, Math.min(max, v))
    }

    function zoomAt(pivotX: number, pivotY: number, factor: number) {
        const newScale = clamp(transform.scale * factor, MIN_SCALE, MAX_SCALE)
        const ratio = newScale / transform.scale
        transform.x = pivotX - (pivotX - transform.x) * ratio
        transform.y = pivotY - (pivotY - transform.y) * ratio
        transform.scale = newScale
        notify()
    }

    function zoomIn() {
        const el = targetRef.value
        if (!el) return
        zoomAt(el.offsetWidth / 2, el.offsetHeight / 2, 1 + ZOOM_STEP)
    }

    function zoomOut() {
        const el = targetRef.value
        if (!el) return
        zoomAt(el.offsetWidth / 2, el.offsetHeight / 2, 1 - ZOOM_STEP)
    }

    function resetView() {
        transform.x = 0
        transform.y = 0
        transform.scale = 1
        notify()
    }

    function fitView(shapes: readonly { getBounds(): Bounds | null }[]) {
        const el = targetRef.value
        if (!el || !shapes.length) return

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

        for (const shape of shapes) {
            const b = shape.getBounds()
            if (!b) continue
            if (b.minX < minX) minX = b.minX
            if (b.minY < minY) minY = b.minY
            if (b.maxX > maxX) maxX = b.maxX
            if (b.maxY > maxY) maxY = b.maxY
        }

        if (!isFinite(minX)) return

        const padding = 24
        const contentW = maxX - minX || 1
        const contentH = maxY - minY || 1
        transform.scale = clamp(
            Math.min(
                (el.offsetWidth - padding * 2) / contentW,
                (el.offsetHeight - padding * 2) / contentH
            ),
            MIN_SCALE, MAX_SCALE
        )
        transform.x = (el.offsetWidth - contentW * transform.scale) / 2 - minX * transform.scale
        transform.y = (el.offsetHeight - contentH * transform.scale) / 2 - minY * transform.scale
        notify()
    }

    // ---- Souris ----
    let isDragging = false
    let dragStart = {x: 0, y: 0}

    function onMouseDown(e: MouseEvent) {
        if (e.button !== panButton) return
        isDragging = true
        dragStart = {x: e.clientX - transform.x, y: e.clientY - transform.y}
    }

    function onMouseMove(e: MouseEvent) {
        if (!isDragging) return
        transform.x = e.clientX - dragStart.x
        transform.y = e.clientY - dragStart.y
        notify()
    }

    function onMouseUp() {
        isDragging = false
    }

    function onWheel(e: WheelEvent) {
        e.preventDefault()
        const rect = targetRef.value!.getBoundingClientRect()
        const factor = e.deltaY < 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor)
    }

    // ---- Touch ----
    interface TouchSnap {x: number; y: number}
    let lastTouches: TouchSnap[] = []
    let lastPinchDist = 0

    function snapTouches(touches: TouchList): TouchSnap[] {
        const result: TouchSnap[] = []
        for (const t of Array.from(touches)) result.push({x: t.clientX, y: t.clientY})
        return result
    }

    function touchDist(a: TouchSnap, b: TouchSnap): number {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
    }

    function onTouchStart(e: TouchEvent) {
        e.preventDefault()
        lastTouches = snapTouches(e.touches)
        if (e.touches.length === 2) lastPinchDist = touchDist(lastTouches[0], lastTouches[1])
    }

    function onTouchMove(e: TouchEvent) {
        e.preventDefault()
        const current = snapTouches(e.touches)
        const rect = targetRef.value!.getBoundingClientRect()

        if (current.length === 1 && lastTouches.length >= 1 && (!canPan || canPan())) {
            transform.x += current[0].x - lastTouches[0].x
            transform.y += current[0].y - lastTouches[0].y
            notify()
        } else if (current.length === 2 && lastTouches.length === 2) {
            const newDist = touchDist(current[0], current[1])
            const factor = newDist / lastPinchDist
            const midX = (current[0].x + current[1].x) / 2 - rect.left
            const midY = (current[0].y + current[1].y) / 2 - rect.top
            const lastMidX = (lastTouches[0].x + lastTouches[1].x) / 2 - rect.left
            const lastMidY = (lastTouches[0].y + lastTouches[1].y) / 2 - rect.top
            const newScale = clamp(transform.scale * factor, MIN_SCALE, MAX_SCALE)
            const ratio = newScale / transform.scale
            transform.x = midX - (midX - transform.x) * ratio + (midX - lastMidX)
            transform.y = midY - (midY - transform.y) * ratio + (midY - lastMidY)
            transform.scale = newScale
            lastPinchDist = newDist
            notify()
        }

        lastTouches = current
    }

    function onTouchEnd(e: TouchEvent) {
        lastTouches = snapTouches(e.touches)
        lastPinchDist = lastTouches.length === 2 ? touchDist(lastTouches[0], lastTouches[1]) : 0
    }

    // ---- Lifecycle ----
    onMounted(() => {
        const el = targetRef.value!
        el.addEventListener('mousedown', onMouseDown)
        el.addEventListener('mousemove', onMouseMove)
        el.addEventListener('mouseup', onMouseUp)
        el.addEventListener('mouseleave', onMouseUp)
        el.addEventListener('touchstart', onTouchStart, {passive: false})
        el.addEventListener('touchmove', onTouchMove, {passive: false})
        el.addEventListener('touchend', onTouchEnd)
        el.addEventListener('wheel', onWheel, {passive: false})
    })

    onUnmounted(() => {
        const el = targetRef.value
        if (!el) return
        el.removeEventListener('mousedown', onMouseDown)
        el.removeEventListener('mousemove', onMouseMove)
        el.removeEventListener('mouseup', onMouseUp)
        el.removeEventListener('mouseleave', onMouseUp)
        el.removeEventListener('touchstart', onTouchStart)
        el.removeEventListener('touchmove', onTouchMove)
        el.removeEventListener('touchend', onTouchEnd)
        el.removeEventListener('wheel', onWheel)
    })

    return {transform, cssTransform, zoomIn, zoomOut, resetView, zoomAt, fitView}
}
