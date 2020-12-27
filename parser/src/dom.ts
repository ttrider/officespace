import { Context } from "./context";
import { FloorPlanParseContext } from "./floorPlan";
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

export class SpaceElement implements Element {
    context: Context;
    area?: number;
    type = "space";
    idSet: string[];
    floorPlanParseContextValue?: FloorPlanParseContext;
    wallElements: WallElement[] = [];
    wallSegments: WallSegment[] = [];

    constructor(context: Context, name: string, floor?: string) {
        this.idSet = ["floor", floor ?? "main", "space", name];
        this.context = context;
    }

    get id() {
        return this.idSet.join(".");
    }

    get floorPlanParseContext() {
        if (!this.floorPlanParseContextValue) {
            this.floorPlanParseContextValue = new FloorPlanParseContext(this);
        }
        return this.floorPlanParseContextValue;
    }
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

export interface WallSegment {
    leftSegment?: WallSegment;
    leftId: string;
    rightSegment?: WallSegment;
    rightId: string;
    wall: WallElement;
}