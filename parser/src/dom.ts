import { roundToPrecision } from "./utils";

export interface Element {
    type: string;
    idSet: string[];
}

export interface AnchorElement extends Element {
    position: {
        x: number,
        y: number
    }
}

export interface WallElement extends Element {
    left: WallCorner;
    right: WallCorner;
    orientation: number;
    length: number;
    thickness: number;
}

export interface SpaceElement extends Element {
    area?: number
}

export class WallCorner {

    x: number;
    y: number;
    xd: number;
    yd: number;
    height: number;

    constructor(x: number, y: number, height?: number) {
        this.x = roundToPrecision(x);
        this.y = roundToPrecision(y);
        this.xd = 0;
        this.yd = 0;
        this.height = roundToPrecision(height ?? 0);
    }

    get id() {
        return this.x.toString() + ":" + this.y.toString();
    }

}