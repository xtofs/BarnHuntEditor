import { palette } from './main'

type BaleLevel = 1 | 2 | 3;

export interface ArenaSize {
    widthFt: number;
    heightFt: number;
}

export interface Course {
    arena: ArenaSize;
    items: Item[];
}


export interface Item {
    x: number;
    y: number;
    selected: boolean;

    draw(ctx: CanvasRenderingContext2D, arena: ArenaSize): void;
    getZOrder(): number;

    handleKeyDown(event: KeyboardEvent): boolean;
    hitTest(x: number, y: number): boolean;

    // moveBy(dx: number, dy: number): void;
    applyPlacementRules(arena: ArenaSize): void;
}


export class Bale implements Item {
    constructor(x: number, y: number, isAnchor: boolean = false) {
        this.x = x; this.y = y;
        this.selected = false;
        this.rotated = false;
        this.isAnchor = isAnchor;
        this.level = 1;
    }

    x: number;
    y: number;
    selected: boolean;
    rotated: boolean;
    isAnchor: boolean;
    level: BaleLevel;

    static WIDTH: number = 3;
    static HEIGHT: number = 2;
    static CORNER_RADIUS: number = 0.25;

    with_level(new_level: BaleLevel): Bale {
        this.level = new_level
        return this;
    }

    draw(ctx: CanvasRenderingContext2D, arena: ArenaSize): void {
        const px = toWorldUnits(ctx);
        const level = this.level;

        let style: { fill: string, stroke: string };
        switch (level) {
            case 1: style = palette.bale_level_1; break;
            case 2: style = palette.bale_level_2; break;
            case 3: style = palette.bale_level_3; break;
            default: style = { fill: "hotpink", stroke: "lime" }; break;
        }

        ctx.fillStyle = style.fill;
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = px(1);

        let { x, y } = this;
        let { width: w, height: h } = this.getSize();
        let r = Bale.CORNER_RADIUS;

        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
        ctx.stroke();

        if (this.isAnchor) {
            this.drawAnchorGuides(ctx, arena);
        }

        if (this.selected) {
            const delta = px(4);
            ctx.lineWidth = px(2 /*palette.selection.width*/);
            ctx.strokeStyle = palette.selection.stroke;

            ctx.beginPath();
            ctx.roundRect(x - delta, y - delta, w + delta * 2, h + delta * 2, r);
            ctx.stroke();
        }
    }

    hitTest(x: number, y: number): boolean {
        const { width, height } = this.getSize();
        return x >= this.x && x <= this.x + width && y >= this.y && y <= this.y + height;
    }

    moveBy(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
    }

    applyPlacementRules(arena: ArenaSize) {
        const { width, height } = this.getSize();
        this.x = clamp(this.x, 0, arena.widthFt - width);
        this.y = clamp(this.y, 0, arena.heightFt - height);
    }

    handleKeyDown(event: KeyboardEvent): boolean {
        if (event.key.toLowerCase() === 'r') {
            this.rotated = !this.rotated;
            return true;
        }
        if (event.key.toLowerCase() === 'a') {
            this.isAnchor = !this.isAnchor;
            return true;
        }
        if (event.key === '1' || event.key === '2' || event.key === '3') {
            const level = Number(event.key) as BaleLevel;
            console.log(`set level to ${level}`);
            this.level = level;
            return true;
        }

        return false;
    }

    private getSize() {
        return this.rotated
            ? { width: Bale.WIDTH, height: Bale.HEIGHT }
            : { width: Bale.HEIGHT, height: Bale.WIDTH };
    }

    getZOrder(): number {
        return this.level * 2;
    }

    private drawAnchorGuides(ctx: CanvasRenderingContext2D, arena: ArenaSize) {
        const px = toWorldUnits(ctx);
        const { width, height } = this.getSize();
        const centerX = this.x + width / 2;
        const centerY = this.y + height / 2;

        const leftDistance = this.x;
        const rightDistance = arena.widthFt - (this.x + width);
        const topDistance = this.y;
        const bottomDistance = arena.heightFt - (this.y + height);

        const lineEndX = leftDistance <= rightDistance ? 0 : arena.widthFt;
        const lineStartX = leftDistance <= rightDistance ? this.x : (this.x + width);
        const lineEndY = topDistance <= bottomDistance ? 0 : arena.heightFt;
        const lineStartY = topDistance <= bottomDistance ? this.y : (this.y + height);
        const horizontalDistance = Math.min(leftDistance, rightDistance);
        const verticalDistance = Math.min(topDistance, bottomDistance);

        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = px(1.5);

        ctx.beginPath();
        ctx.moveTo(lineStartX, centerY);
        ctx.lineTo(lineEndX, centerY);
        ctx.moveTo(centerX, lineStartY);
        ctx.lineTo(centerX, lineEndY);
        ctx.stroke();

        const fontSize = px(14);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = '#111827';

        const horizontalText = `${horizontalDistance.toFixed(1)}'`;
        const horizontalMidX = (centerX + lineEndX) / 2;
        const horizontalMidY = centerY;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(horizontalText, horizontalMidX, horizontalMidY - px(3));

        const verticalText = `${verticalDistance.toFixed(1)}'`;
        const verticalMidX = centerX;
        const verticalMidY = (centerY + lineEndY) / 2;

        ctx.textAlign = lineEndX === 0 ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(verticalText, verticalMidX + (lineEndX === 0 ? px(4) : -px(4)), verticalMidY);
    }
}

export class StartBox implements Item {
    constructor(x: number, y: number) {
        this.x = x; this.y = y;
        this.selected = false;
    }

    x: number;
    y: number;
    selected: boolean;

    static WIDTH: number = 3;
    static HEIGHT: number = 3;

    draw(ctx: CanvasRenderingContext2D, _arena: ArenaSize): void {
        const px = toWorldUnits(ctx);

        ctx.fillStyle = palette.start_box.fill;
        ctx.strokeStyle = palette.start_box.stroke;
        ctx.lineWidth = px(1);

        let { x, y } = this;
        let { width: w, height: h } = this.getSize();

        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fill();
        // ctx.stroke();

        if (this.selected) {
            ctx.lineWidth = px(4);
            ctx.strokeStyle = palette.selection.stroke;

            const delta = px(4);
            ctx.beginPath();
            ctx.rect(x - delta, y - delta, w + delta * 2, h + delta * 2);
            ctx.stroke();
        }
    }

    hitTest(x: number, y: number): boolean {
        const { width, height } = this.getSize();
        return x >= this.x && x <= this.x + width && y >= this.y && y <= this.y + height;
    }

    applyPlacementRules(arena: ArenaSize): void {
        const { width, height } = this.getSize();
        const maxX = arena.widthFt - width;
        const maxY = arena.heightFt - height;

        this.x = clamp(this.x, 0, maxX);
        this.y = clamp(this.y, 0, maxY);

        const distanceToLeft = this.x;
        const distanceToRight = maxX - this.x;
        const distanceToTop = this.y;
        const distanceToBottom = maxY - this.y;

        const minDistance = Math.min(
            distanceToLeft,
            distanceToRight,
            distanceToTop,
            distanceToBottom,
        );

        if (minDistance === distanceToLeft) {
            this.x = 0;
        } else if (minDistance === distanceToRight) {
            this.x = maxX;
        } else if (minDistance === distanceToTop) {
            this.y = 0;
        } else {
            this.y = maxY;
        }
    }

    moveBy(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
    }

    handleKeyDown(_event: KeyboardEvent): boolean {
        return false;
    }

    private getSize() {
        return { width: StartBox.WIDTH, height: StartBox.HEIGHT };
    }

    getZOrder(): number {
        return 0;
    }
}

function clamp(x: number, min: number, max: number): number {
    return Math.min(Math.max(min, x), max);
}

function toWorldUnits(ctx: CanvasRenderingContext2D) {
    const scale = Math.max(0.0001, ctx.getTransform().a);
    return (pixels: number) => pixels / scale;
}
