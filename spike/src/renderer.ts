import type { CourseElement } from "./model";

export const style = {
    bale: {
        1:
        {
            fill: '#f6b53b',
            stroke: 'black',
        },
        2:
        {
            fill: '#af7202',
            stroke: 'black',
        },
        3:
        {
            fill: '#744c02',
            stroke: 'black',
        }
    },
    selection: {
        stroke: 'lime',
        width: 4
    },
    startBox: {

        fill: '#259dff',
        stroke: 'black',
    }
} as const;

export function renderCourse(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    elements: CourseElement[]
) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid(ctx, { w: canvas.width, h: canvas.height }, 30, 20);

    elements.sort((a, b) => a.getZOrder() - b.getZOrder());
    for (const element of elements) {
        element.draw(ctx)
    }

}


export function drawGrid(ctx: CanvasRenderingContext2D, size: { w: number; h: number; }, w: number, h: number) {
    const margin = 10
    const unit = Math.min((size.w - margin * 2) / w, (size.h - margin * 2) / h);
    ctx.save();
    ctx.translate(margin, margin)

    ctx.beginPath();
    for (let i = 0; i <= w; i++) {
        ctx.moveTo(i * unit, 0);
        ctx.lineTo(i * unit, h * unit);
    }
    for (let i = 0; i <= h; i++) {
        ctx.moveTo(0, i * unit);
        ctx.lineTo(w * unit, i * unit);
    }
    ctx.strokeStyle = "#DDD";
    ctx.lineWidth = 0.5;

    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.font = "10px sans-serif";

    ctx.textAlign = "center";
    for (let i = 0; i <= w; i += 5) {
        let t = i.toString();
        ctx.textBaseline = "bottom";
        ctx.fillText(t, i * unit, 0 - 1);
        ctx.textBaseline = "top";
        ctx.fillText(t, i * unit, h * unit + 1);
    }

    ctx.textBaseline = "middle";
    for (let i = 0; i <= h; i += 5) {
        let t = i.toString();
        ctx.textAlign = "right";
        ctx.fillText(t, 0 - 1, i * unit);
        ctx.textAlign = "left";
        ctx.fillText(t, w * unit + 2, i * unit);
    }
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w * unit, h * unit);

    ctx.restore()
}
