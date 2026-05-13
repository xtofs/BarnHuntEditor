import { style } from './renderer'

type BaleLevel = 1 | 2 | 3;

export interface ArenaSize {
    widthFt: number;
    heightFt: number;
}

export interface Course {
    arena: ArenaSize;
    elements: CourseElement[];
}


export interface CourseElement {
    x: number;
    y: number;
    selected: boolean;
    draw(ctx: CanvasRenderingContext2D): void;
    hitTest(x: number, y: number): boolean;
    moveBy(dx: number, dy: number, arena: ArenaSize): void;

    handleKeyDown(event: KeyboardEvent): boolean;
    getZOrder(): number;
}


export class Bale implements CourseElement {
    constructor(x: number, y: number) {
        this.x = x; this.y = y;
        this.selected = false;
        this.rotated = false;
        this.level = 1;
    }

    x: number;
    y: number;
    selected: boolean;
    rotated: boolean;
    level: BaleLevel;

    static WIDTH: number = 3;
    static HEIGHT: number = 2;
    static CORNER_RADIUS: number = 0.25;

    draw(ctx: CanvasRenderingContext2D): void {
        const px = toWorldUnits(ctx);
        const level = this.level;
        ctx.fillStyle = style.bale[level].fill;
        ctx.strokeStyle = style.bale[level].stroke;
        ctx.lineWidth = px(1);

        let { x, y } = this;
        let { width: w, height: h } = this.getSize();
        let r = Bale.CORNER_RADIUS;

        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
        ctx.stroke();

        if (this.selected) {
            const delta = px(4);
            ctx.lineWidth = px(style.selection.width);
            ctx.strokeStyle = style.selection.stroke;

            ctx.beginPath();
            ctx.roundRect(x - delta, y - delta, w + delta * 2, h + delta * 2, r);
            ctx.stroke();
        }
    }

    hitTest(x: number, y: number): boolean {
        const { width, height } = this.getSize();
        return x >= this.x && x <= this.x + width && y >= this.y && y <= this.y + height;
    }

    moveBy(dx: number, dy: number, arena: ArenaSize): void {
        this.x += dx;
        this.y += dy;

        const { width, height } = this.getSize();

        this.x = clamp(this.x, 0, arena.widthFt - width);
        this.y = clamp(this.y, 0, arena.heightFt - height);
    }

    handleKeyDown(event: KeyboardEvent): boolean {
        if (event.key.toLowerCase() === 'r') {
            this.rotated = !this.rotated;
            return true;
        }
        if (event.key === '1' || event.key === '2' || event.key === '3') {
            this.level = Number(event.key) as BaleLevel;
            console.log(`level set to ${this.level}`);
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
}

export class StartBox implements CourseElement {
    constructor(x: number, y: number) {
        this.x = x; this.y = y;
        this.selected = false;
    }

    x: number;
    y: number;
    selected: boolean;

    static WIDTH: number = 3;
    static HEIGHT: number = 3;

    draw(ctx: CanvasRenderingContext2D): void {
        const px = toWorldUnits(ctx);

        ctx.fillStyle = style.startBox.fill;
        ctx.strokeStyle = style.startBox.stroke;
        ctx.lineWidth = px(1);

        let { x, y } = this;
        let { width: w, height: h } = this.getSize();

        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fill();
        ctx.stroke();

        if (this.selected) {
            const delta = px(4);
            ctx.lineWidth = px(style.selection.width);
            ctx.strokeStyle = style.selection.stroke;

            ctx.beginPath();
            ctx.rect(x - delta, y - delta, w + delta * 2, h + delta * 2);
            ctx.stroke();
        }
    }

    hitTest(x: number, y: number): boolean {
        const { width, height } = this.getSize();
        return x >= this.x && x <= this.x + width && y >= this.y && y <= this.y + height;
    }

    moveBy(dx: number, dy: number, arena: ArenaSize): void {
        const { width, height } = this.getSize();
        const maxX = arena.widthFt - width;
        const maxY = arena.heightFt - height;

        this.x = clamp(this.x + dx, 0, maxX);
        this.y = clamp(this.y + dy, 0, maxY);

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

