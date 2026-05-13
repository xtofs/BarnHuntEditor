import { style } from './renderer';

type BaleLevel = 1 | 2 | 3;


export interface CourseElement {
    x: number;
    y: number;
    selected: boolean;
    draw(ctx: CanvasRenderingContext2D): void;
    hitTest(x: number, y: number): boolean;
    // moveBy(dx: number, dy: number, rect: { width: number, height: number }): void;
    moveBy(dx: number, dy: number, rect: DOMRect): void;

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

    static WIDTH: number = 160;
    static HEIGHT: number = 80;
    static CORNER_RADIUS: number = 5;

    draw(ctx: CanvasRenderingContext2D): void {
        const level = this.level;
        ctx.fillStyle = style.bale[level].fill;
        ctx.strokeStyle = style.bale[level].stroke;
        ctx.lineWidth = 1;

        let { x, y } = this;
        let { width: w, height: h } = this.getSize();
        let r = Bale.CORNER_RADIUS;

        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
        ctx.stroke();

        if (this.selected) {
            const delta = 4;
            ctx.lineWidth = style.selection.width;
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

    moveBy(dx: number, dy: number, rect: DOMRect): void {
        this.x += dx;
        this.y += dy;

        const { width, height } = this.getSize();

        this.x = clamp(this.x, 0, rect.right - width);
        this.y = clamp(this.y, 0, rect.bottom - height);
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

    static WIDTH: number = 100;
    static HEIGHT: number = 100;

    draw(ctx: CanvasRenderingContext2D): void {

        ctx.fillStyle = style.startBox.fill;
        ctx.strokeStyle = style.startBox.stroke;
        ctx.lineWidth = 1;

        let { x, y } = this;
        let { width: w, height: h } = this.getSize();

        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fill();
        ctx.stroke();

        if (this.selected) {
            const delta = 4;
            ctx.lineWidth = style.selection.width;
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

    moveBy(dx: number, dy: number, rect: DOMRect): void {

        if (this.x <= 8 && this.y <= 8) {
            this.x += dx;
            this.y += dy;
        } else if (this.x <= 8) {
            this.x = 0;
            this.y += dy;
        } else if (this.y <= 8) {
            this.x += dx;
            this.y = 0;
        } else {
            this.x += dx;
            this.y += dy;
        }
        const { width, height } = this.getSize();

        this.x = clamp(this.x, 2, rect.right - width);
        this.y = clamp(this.y, 2, rect.bottom - height);
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

