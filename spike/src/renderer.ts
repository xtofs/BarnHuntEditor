import type { ArenaSize, Course } from './model';

export interface ArenaViewport {
    scale: number;
    offsetX: number;
    offsetY: number;
}

export const style = {
    bale: {
        1: {
            fill: '#f6b53b',
            stroke: 'black',
        },
        2: {
            fill: '#af7202',
            stroke: 'black',
        },
        3: {
            fill: '#744c02',
            stroke: 'black',
        },
    },
    selection: {
        stroke: 'lime',
        width: 4,
    },
    startBox: {
        fill: '#259dff',
        stroke: 'black',
    },
} as const;

export function renderCourse(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    course: Course,
) {
    const viewport = getArenaViewport(canvas, course.arena);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewport.offsetX, viewport.offsetY);
    ctx.scale(viewport.scale, viewport.scale);

    drawGrid(ctx, course.arena);

    course.elements.sort((a, b) => a.getZOrder() - b.getZOrder());
    for (const element of course.elements) {
        element.draw(ctx);
    }

    ctx.restore();
}

export function getArenaViewport(canvas: HTMLCanvasElement, arena: ArenaSize): ArenaViewport {
    const paddingPx = 20;
    const availableWidth = Math.max(1, canvas.width - paddingPx * 2);
    const availableHeight = Math.max(1, canvas.height - paddingPx * 2);
    const scale = Math.min(availableWidth / arena.widthFt, availableHeight / arena.heightFt);

    const contentWidth = arena.widthFt * scale;
    const contentHeight = arena.heightFt * scale;

    return {
        scale,
        offsetX: (canvas.width - contentWidth) / 2,
        offsetY: (canvas.height - contentHeight) / 2,
    };
}

export function canvasPointToWorld(
    canvasX: number,
    canvasY: number,
    viewport: ArenaViewport,
) {
    return {
        x: (canvasX - viewport.offsetX) / viewport.scale,
        y: (canvasY - viewport.offsetY) / viewport.scale,
    };
}

export function drawGrid(ctx: CanvasRenderingContext2D, arena: ArenaSize) {
    const scale = Math.max(0.0001, ctx.getTransform().a);
    const px = (value: number) => value / scale;
    const majorStepFt = 5;

    ctx.beginPath();
    for (let x = 0; x <= arena.widthFt; x += 1) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, arena.heightFt);
    }
    for (let y = 0; y <= arena.heightFt; y += 1) {
        ctx.moveTo(0, y);
        ctx.lineTo(arena.widthFt, y);
    }
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = px(0.75);
    ctx.stroke();

    ctx.fillStyle = '#222';
    ctx.font = `${px(11)}px sans-serif`;

    ctx.textAlign = 'center';
    for (let x = 0; x <= arena.widthFt; x += majorStepFt) {
        const label = x.toString();
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, x, -px(2));
        ctx.textBaseline = 'top';
        ctx.fillText(label, x, arena.heightFt + px(2));
    }

    ctx.textBaseline = 'middle';
    for (let y = 0; y <= arena.heightFt; y += majorStepFt) {
        const label = y.toString();
        ctx.textAlign = 'right';
        ctx.fillText(label, -px(2), y);
        ctx.textAlign = 'left';
        ctx.fillText(label, arena.widthFt + px(2), y);
    }

    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = px(2);
    ctx.strokeRect(0, 0, arena.widthFt, arena.heightFt);
}
