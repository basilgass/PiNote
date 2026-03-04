import {AxisOptions, GridOptions, OriginMode, RuledOptions} from "../types"

export function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, opt: GridOptions) {
    const {
        size,
        color = '#ddd',
        lineWidth = 1,
        majorEvery = 0,
        majorColor = '#bbb',
        majorWidth = 1.5
    } = opt

    if (size <= 0) return

    ctx.save()

    for (let x = 0; x <= w; x += size) {
        const isMajor = majorEvery > 0 && (x / size) % majorEvery === 0
        ctx.strokeStyle = isMajor ? majorColor : color
        ctx.lineWidth = isMajor ? majorWidth : lineWidth

        const px = Math.round(x) + 0.5

        ctx.beginPath()
        ctx.moveTo(px, 0)
        ctx.lineTo(px, h)
        ctx.stroke()
    }

    for (let y = 0; y <= h; y += size) {
        const isMajor = majorEvery > 0 && (y / size) % majorEvery === 0
        ctx.strokeStyle = isMajor ? majorColor : color
        ctx.lineWidth = isMajor ? majorWidth : lineWidth

        const py = Math.round(y) + 0.5

        ctx.beginPath()
        ctx.moveTo(0, py)
        ctx.lineTo(w, py)
        ctx.stroke()
    }

    ctx.restore()
}

export function drawRuled(ctx: CanvasRenderingContext2D, w: number, h: number, opt: RuledOptions) {
    const {
        spacing,
        color = '#cfd8ff',
        lineWidth = 1,
        marginTop = 0
    } = opt

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth

    for (let y = marginTop; y <= h; y += spacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
    }

    ctx.restore()
}

export function drawAxes(ctx: CanvasRenderingContext2D, w: number, h: number, opt: AxisOptions) {
    const {
        origin = {mode: 'center'},
        color = '#000',
        lineWidth = 2,
        arrowSize = 10,
        tickSize = 0,
        padding = 0,
    } = opt

    const {x, y} =  resolveOrigin(w,  h, padding, origin)
    const originX = alignPixel(x, lineWidth)
    const originY = alignPixel(y, lineWidth)
    const p = padding===0 ? tickSize/3 : padding

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth

    // Axe X
    ctx.beginPath()
    ctx.moveTo(p, originY)
    ctx.lineTo(w - p, originY)
    ctx.stroke()
    drawArrow(ctx, p, originY, w - p, originY, arrowSize)

    // Axe Y
    ctx.beginPath()
    ctx.moveTo(originX, p)
    ctx.lineTo(originX, h - p)
    ctx.stroke()
    drawArrow(ctx, originX, h - p, originX, p, arrowSize)

    if (tickSize) {
        ctx.lineWidth = 1
        // Ticks on horizontal axis
        drawTicksFromOrigin(ctx, originX, p, w-p, tickSize, (x) => {
            ctx.beginPath()
            ctx.moveTo(x, originY - 5)
            ctx.lineTo(x, originY + 5)
            ctx.stroke()
        })

        // Ticks on vertical axis
        drawTicksFromOrigin(ctx, originY, p, h-p, tickSize, (y) => {
            ctx.beginPath()
            ctx.moveTo(originX - 5, y)
            ctx.lineTo(originX + 5, y)
            ctx.stroke()
        })

    }

    ctx.restore()
}

function resolveOrigin(
    w: number,
    h: number,
    padding: number,
    origin: OriginMode
) {
    switch (origin.mode) {
        case 'center':
            return {x: w / 2, y: h / 2}

        case 'bottom':
            return {x: w / 2, y: h - padding}

        case 'bottom-left':
            return {x: padding, y: h - padding}

        case 'manual':
            return {x: origin.x, y: origin.y}
    }
}

function drawArrow(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    size: number
) {
    const angle = Math.atan2(toY - fromY, toX - fromX)

    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(
        toX - size * Math.cos(angle - Math.PI / 6),
        toY - size * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(toX, toY)
    ctx.lineTo(
        toX - size * Math.cos(angle + Math.PI / 6),
        toY - size * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
}

function drawTicksFromOrigin(
    ctx: CanvasRenderingContext2D,
    origin: number,
    min: number,
    max: number,
    step: number,
    draw: (v: number) => void
) {
    const startIndex = Math.ceil((min - origin) / step)
    const endIndex   = Math.floor((max - origin) / step)

    for (let i = startIndex; i <= endIndex; i++) {
        draw(origin + i * step)
    }
}

function alignPixel(v: number, lineWidth: number) {
    return lineWidth % 2 === 1
        ? Math.round(v) + 0.5
        : Math.round(v)
}