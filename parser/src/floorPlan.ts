import { Context } from "./context";
import { AnchorElement, SpaceElement, WallCorner, WallElement, WallSegment } from "./dom";
import { AnchorItem, WallItem } from "./dsl";
import { normalizeOrientation, parseAngle, parseLength, roundToPrecision, safeAcos, safeCos, safeSin } from "./utils";


export class FloorPlanParseContext {

    context: Context;
    parent: SpaceElement;
    lastIndex = 0;
    wallThickness: number;
    idParts: string[];
    x = 0;
    y = 0;
    orientation = 0;
    height: number;

    

    constructor(parent: SpaceElement) {
        this.context = parent.context;
        this.parent = parent;

        this.wallThickness = this.context.innerWallThickness;
        this.height = this.context.innerWallHeight;

        this.idParts = [...parent.idSet];
    }

    get id() {
        return this.idParts.join(".");
    }

    getIdSet(idItems?: string | string[]) {

        const items = [...this.idParts];
        if (idItems) {
            idItems = Array.isArray(idItems) ? idItems : [idItems];

            for (const idItem of idItems) {

                const parts = idItem.trim().split(".");
                for (let part of parts) {
                    part = part.trim();
                    if (part) {
                        items.push(part);
                    }
                }
            }
        }

        return items;
    }


    processAnchor(item?: AnchorItem | string) {
        if (!item) return;
        const anchor = (typeof item === "string") ? { name: item } : item;

        const idSet = this.getIdSet(["anchor", anchor.name]);

        // support offset here


        const element = {
            type: "anchor",
            idSet,
            position: {
                x: this.x,
                y: this.y
            }

        } as AnchorElement;

        this.context.elements[idSet.join(".")] = element;
    }

    processRotate(item?: string) {
        const value = parseAngle(item);

        this.orientation += value;
        this.orientation = normalizeOrientation(this.orientation);
    }

    processWall(item: WallItem) {
        if (!item) return;

        const name = item.name ? item.name : "wall" + (this.lastIndex++).toString();

        const idSet = this.getIdSet(["wall", name]);

        const startPosition = new WallCorner(this.x, this.y, this.height);

        if (item.from) {
            // TODO detect start point and use it instead
            throw new Error("not implemented yet")
        }

        if (item.to) {
            throw new Error("not implemented yet");

        } else {

            let length = parseLength(item.length, true);
            const cx = roundToPrecision(length * safeCos(this.orientation));
            const cy = roundToPrecision(length * safeSin(this.orientation));

            const endPosition = new WallCorner(this.x + cx, this.y + cy, this.height);

            const left = length < 0 ? endPosition : startPosition;
            const right = length < 0 ? startPosition : endPosition;

            length = Math.abs(length);

            this.x = endPosition.x;
            this.y = endPosition.y;
            if (item.thickness) {
                const t = parseLength(item.thickness);
                this.wallThickness = t;
            }
            if (item.height) {

                if (typeof item.height == "string") {
                    const h = parseLength(item.height);
                    left.height = right.height = h;
                } else {
                    if (item.height.left) {
                        left.height = parseLength(item.height.left);
                    }
                    if (item.height.right) {
                        right.height = parseLength(item.height.right);
                    }
                }
            }

            // calculate depths
            const dcx = roundToPrecision(this.wallThickness * safeCos(this.orientation - 90));
            const dcy = roundToPrecision(this.wallThickness * safeSin(this.orientation - 90));

            left.xd = left.x + dcx;
            left.yd = left.y + dcy;
            right.xd = right.x + dcx;
            right.yd = right.y + dcy;

            const wallElement =
                {
                    type: "wall",
                    idSet,
                    left,
                    right,
                    length,
                    thickness: this.wallThickness,
                    orientation: this.orientation,

                } as WallElement;

            this.parent.wallElements.push(wallElement);

            this.context.elements[idSet.join(".")] = wallElement;
        }
    }


    postProcessWalls() {

        const corners = this.parent.wallElements.reduce((data, item) => {

            const leftCorner = item.left.id;
            const rightCorner = item.right.id;

            const leftSet = data[leftCorner] ? data[leftCorner] : (data[leftCorner] = []);
            const rightSet = data[rightCorner] ? data[rightCorner] : (data[rightCorner] = []);

            const corner = { wall: item, leftId: leftCorner, rightId: rightCorner };

            leftSet.push(corner);
            rightSet.push(corner);

            return data;
        }, {} as { [data: string]: WallSegment[] });



        for (const cornerId in corners) {
            if (Object.prototype.hasOwnProperty.call(corners, cornerId)) {
                const corner = corners[cornerId];

                if (corner.length === 1) {
                    // end segment
                    if (cornerId === corner[0].leftId) {
                        // start new path
                        this.parent.wallSegments.push(corner[0]);
                    }
                    // if we have only right corner, it is ok to skip it
                } else if (corner.length === 2) {

                    if (cornerId === corner[0].leftId) {
                        // the other one MUST be thr right corner
                        if (cornerId === corner[1].rightId) {
                            corner[0].leftSegment = corner[1];
                            corner[1].rightSegment = corner[0];
                        } else {
                            throw new Error("incorrent segment linking: " + cornerId);
                        }
                    } else if (cornerId === corner[1].leftId) {
                        // the other one MUST be thr right corner
                        if (cornerId === corner[0].rightId) {
                            corner[1].leftSegment = corner[0];
                            corner[0].rightSegment = corner[1];
                        } else {
                            throw new Error("incorrent segment linking: " + cornerId);
                        }
                    } else {
                        throw new Error("incorrent segment linking: " + cornerId);
                    }
                } else {
                    throw new Error("too many segments for one corner: " + cornerId);
                }
            }
        }


        for (const wallPath of this.parent.wallSegments) {
            processPath(wallPath);
        }

        function processPath(head: WallSegment) {
            // head we can leave alone
            let current = head;
            while (current.rightSegment !== undefined) {

                const leftWall = current.wall;
                const rightWall = current.rightSegment.wall;

                const LRd = normalizeOrientation(rightWall.orientation - leftWall.orientation);

                const cosLRd = safeCos(LRd - 90);
                const Lsm = rightWall.thickness / (cosLRd ? cosLRd : 1);
                const Rsm = leftWall.thickness / (cosLRd ? cosLRd : 1);
                const f = roundToPrecision(Math.sqrt(Math.abs(
                    Lsm * Lsm +
                    Rsm * Rsm +
                    2 * Lsm * Rsm * safeCos(normalizeOrientation(rightWall.orientation - leftWall.orientation) - 180)
                )));


                const RRd = safeAcos(leftWall.thickness / f);
                const fd = (LRd < 0) ? (RRd - leftWall.orientation) : (RRd + leftWall.orientation);


                let dx = roundToPrecision(f * safeSin(fd));
                const dy = roundToPrecision(f * safeCos(fd));

                if (LRd < 0) {
                    dx = -dx;
                }

                // console.info(JSON.stringify({
                //     Lo: leftWall.orientation,
                //     Ro: rightWall.orientation,
                //     L: leftWall.thickness,
                //     R: rightWall.thickness,
                //     LRd,
                //     Lsm,
                //     Rsm,
                //     f,
                //     RRd,
                //     fd,
                //     dx,
                //     dy

                // }, null, 2))

                leftWall.right.xd = leftWall.right.x + dx;
                leftWall.right.yd = leftWall.right.y - dy;

                rightWall.left.xd = leftWall.right.xd;
                rightWall.left.yd = leftWall.right.yd;

                current = current.rightSegment;
            }
        }
    }
}