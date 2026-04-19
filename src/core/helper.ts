import {GridOptions, HexOptions, RuledOptions} from "../types"

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

export function drawHex(ctx: CanvasRenderingContext2D, w: number, h: number, opt: HexOptions) {
    const { size, color = '#ddd', lineWidth = 1, orientation = 'pointy' } = opt

    if (size <= 0) return

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth

    if (orientation === 'pointy') {
        // Sommet en haut/bas — hexW = √3·size, espacement lignes = 1.5·size
        const hexW = Math.sqrt(3) * size
        const rowH = size * 1.5
        const cols = Math.ceil(w / hexW) + 2
        const rows = Math.ceil(h / rowH) + 2
        for (let row = -1; row < rows; row++) {
            for (let col = -1; col < cols; col++) {
                const cx = col * hexW + (row % 2 !== 0 ? hexW / 2 : 0)
                const cy = row * rowH
                drawHexagon(ctx, cx, cy, size, Math.PI / 6)
            }
        }
    } else {
        // Arête horizontale — hexH = √3·size, espacement colonnes = 1.5·size
        const hexH = Math.sqrt(3) * size
        const colW = size * 1.5
        const cols = Math.ceil(w / colW) + 2
        const rows = Math.ceil(h / hexH) + 2
        for (let row = -1; row < rows; row++) {
            for (let col = -1; col < cols; col++) {
                const cx = col * colW
                const cy = row * hexH + (col % 2 !== 0 ? hexH / 2 : 0)
                drawHexagon(ctx, cx, cy, size, 0)
            }
        }
    }

    ctx.restore()
}

function drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, angleOffset: number) {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
        const angle = angleOffset + (i * Math.PI) / 3
        const x = cx + size * Math.cos(angle)
        const y = cy + size * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
}