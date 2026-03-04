// ShapeFactory.ts
import {ToolType} from "src/types"
import {Stroke, StrokeOptions} from "@core/drawable/Stroke"
import {Drawable} from "@core/drawable/Drawable"
import {Circle} from "@core/drawable/Circle"
import {Line} from "@core/drawable/Line"
import {Rectangle} from "@core/drawable/Rectangle"

export interface ShapeStartConfig extends StrokeOptions {
    x: number
    y: number
}

export class ShapeFactory {

    static create(tool: ToolType, config: ShapeStartConfig): Drawable {

        const {x, y, ...options} = config

        switch (tool) {

            case 'pen':
            case 'highlighter':
            case 'eraser':
                return new Stroke(options)

            case 'line':
                return new Line(x, y, x, y, options)

            case 'circle':
                return new Circle(x, y, 0, options)

            case 'rectangle':
                return new Rectangle(x, y, 0, 0, options)

            default:
                throw new Error(`Tool not supported: ${tool}`)
        }
    }
}