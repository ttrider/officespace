import YAML from 'yaml'
import fs from "fs";
import { roundToPrecision, parseLength, normalizeOrientation, safeCos, safeAcos, safeSin } from "./utils";
import { AnchorItem, WallItem } from './dsl';
import { AnchorElement, Element, SpaceElement, WallCorner, WallElement } from "./dom";


function buildSvg(data: { [name: string]: Element }) {

    const mult = 10;

    let left = 0;
    let right = 0;
    let top = 0;
    let bottom = 0;

    const lines: string[] = [];


    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const element = data[key];

            if (element.type === "wall") {
                const wall = element as WallElement;

                left = Math.min(left, wall.left.x, wall.right.x);
                right = Math.max(right, wall.left.x, wall.right.x);
                top = Math.min(top, wall.left.y, wall.right.y);
                bottom = Math.max(bottom, wall.left.y, wall.right.y);

                lines.push(`M ${wall.left.x * mult},${wall.left.y * mult} L ${wall.right.x * mult},${wall.right.y * mult}`);
            }
        }
    }

    const x = (left - 10) * mult;
    const y = (top - 10) * mult;
    const width = (Math.abs(right - left) + 20) * mult;
    const height = (Math.abs(bottom - top) + 20) * mult;

    const ret = `<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='${x} ${y} ${width} ${height}'>` +
        "\n" +
        `<rect fill="white" stroke="black" stroke-width="5" x="${x}" y="${y}" width="${width}" height="${height}" />` +
        "\n" +
        `<path fill="none" stroke="black" d="${lines.join(" ")}"/>` +
        "\n</svg>";

    return ret;

}

function buildSvg2(data: { [name: string]: Element }) {

    const mult = 10;

    let left = 0;
    let right = 0;
    let top = 0;
    let bottom = 0;

    const lines: string[] = [];
    const linesInner: string[] = [];

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const element = data[key];

            if (element.type === "wall") {
                const wall = element as WallElement;

                left = Math.min(left, wall.left.x, wall.right.x);
                right = Math.max(right, wall.left.x, wall.right.x);
                top = Math.min(top, wall.left.y, wall.right.y);
                bottom = Math.max(bottom, wall.left.y, wall.right.y);

                left = Math.min(left, wall.left.xd, wall.right.xd);
                right = Math.max(right, wall.left.xd, wall.right.xd);
                top = Math.min(top, wall.left.yd, wall.right.yd);
                bottom = Math.max(bottom, wall.left.yd, wall.right.yd);

                linesInner.push(`M ${wall.left.x * mult},${wall.left.y * mult} L ${wall.right.x * mult},${wall.right.y * mult}`);


                lines.push(`M ${wall.left.x * mult},${wall.left.y * mult} L ${wall.right.x * mult},${wall.right.y * mult} L ${wall.right.xd * mult},${wall.right.yd * mult} L ${wall.left.xd * mult},${wall.left.yd * mult} L ${wall.left.x * mult},${wall.left.y * mult}`);
            }
        }
    }

    const x = (left - 10) * mult;
    const y = (top - 10) * mult;
    const width = (Math.abs(right - left) + 20) * mult;
    const height = (Math.abs(bottom - top) + 20) * mult;

    const ret = `<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='${x} ${y} ${width} ${height}'>` +
        "\n" +
        `<rect fill="white" stroke="black" stroke-width="5" x="${x}" y="${y}" width="${width}" height="${height}" />` +
        "\n" +
        `<path fill="none" stroke="black" d="${lines.join(" ")}"/>` +
        "\n" +
        `<path fill="none" stroke="red" stroke-width="3" d="${linesInner.join(" ")}"/>` +
        "\n</svg>";

    return ret;

}

const innerWallThickness = parseLength("4-1/4\"");
const innerWallHeight = parseLength("9'");
















function processData(input: any) {

    const objects: { [name: string]: Element } = {};


    const current = {
        lastIndex: 0,
        wallThickness: innerWallThickness,
        idParts: [] as string[],
        x: 0,
        y: 0,
        orientation: 0,
        height: innerWallHeight,


        get id() {
            return this.idParts.join(".");
        },

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
    };

    const spaces = input.spaces;

    for (const spaceName in spaces) {
        if (Object.prototype.hasOwnProperty.call(spaces, spaceName)) {
            const space = spaces[spaceName];

            current.idParts.push(spaceName);
            objects[current.id] = {
                type: "Space",
                idSet: current.getIdSet(),
                area: 0
            } as SpaceElement;


            if (space.floorPlan) {

                for (const fpItem of space.floorPlan) {

                    if (fpItem.$anchor) {
                        processAnchor(fpItem.$anchor);
                    } else if (fpItem.$rotate) {
                        processRotate(fpItem.$rotate);
                    } else if (fpItem.wall) {
                        processWall(fpItem.wall);
                    }
                }
            }
        }
    }


    return objects;


    function processAnchor(item?: AnchorItem | string) {
        if (!item) return;
        const anchor = (typeof item === "string") ? { name: item } : item;

        const idSet = current.getIdSet(["anchor", anchor.name]);

        // support offset here

        objects[idSet.join(".")] = {
            type: "anchor",
            idSet,
            position: {
                x: current.x,
                y: current.y
            }

        } as AnchorElement;

    }

    function processRotate(item?: string) {
        if (!item) return;

        const regex = /(-)?(([0-9]{1,3})|(@[\w]+))(\s?deg?(\s((cw)|(ccw)|(left)|(right)))?)?/gm;

        const match = regex.exec(item);
        if (!match) {
            throw new Error("can't parse rotate");
        }

        if (match[4]) {
            throw new Error("unsupported mode with variables");
        }

        if (!match[3]) {
            throw new Error("missing angle value");
        }

        let value = parseInt(match[3]);
        if (isNaN(value)) {
            throw new Error("angle is not a number");
        }

        if (match[1]) {
            value = -value;
        }
        if (match[10]) {
            value = -value;
        }
        if (match[9]) {
            value = -value;
        }

        current.orientation += value;
        current.orientation = normalizeOrientation(current.orientation);
    }

    function processWall(item: WallItem) {
        if (!item) return;

        const name = item.name ? item.name : "wall" + (current.lastIndex++).toString();

        const idSet = current.getIdSet(["wall", name]);

        const startPosition = new WallCorner(current.x, current.y, current.height);

        if (item.from) {
            // TODO detect start point and use it instead
            throw new Error("not implemented yet")
        }

        if (item.to) {
            throw new Error("not implemented yet");

        } else {

            let length = parseLength(item.length, true);
            const cx = roundToPrecision(length * safeCos(current.orientation));
            const cy = roundToPrecision(length * safeSin(current.orientation));

            const endPosition = new WallCorner(current.x + cx, current.y + cy, current.height);

            const left = length < 0 ? endPosition : startPosition;
            const right = length < 0 ? startPosition : endPosition;

            length = Math.abs(length);

            current.x = endPosition.x;
            current.y = endPosition.y;
            if (item.thickness) {
                const t = parseLength(item.thickness);
                current.wallThickness = t;
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
            const dcx = roundToPrecision(current.wallThickness * safeCos(current.orientation - 90));
            const dcy = roundToPrecision(current.wallThickness * safeSin(current.orientation - 90));

            left.xd = left.x + dcx;
            left.yd = left.y + dcy;
            right.xd = right.x + dcx;
            right.yd = right.y + dcy;

            objects[idSet.join(".")] = {
                type: "wall",
                idSet,
                left,
                right,
                length,
                thickness: current.wallThickness,
                orientation: current.orientation,

            } as WallElement;
        }
    }


}

function wallConnections(data: { [name: string]: Element }) {

    // list corners
    // for each corner, adjust depth
    // build wall path


    const walls = Object.values(data).filter(el => el.type === "wall") as WallElement[];

    const corners = walls.reduce((data, item) => {

        const leftCorner = item.left.id;
        const rightCorner = item.right.id;

        const leftSet = data[leftCorner] ? data[leftCorner] : (data[leftCorner] = []);
        const rightSet = data[rightCorner] ? data[rightCorner] : (data[rightCorner] = []);

        const corner = { wall: item, leftId: leftCorner, rightId: rightCorner };

        leftSet.push(corner);
        rightSet.push(corner);

        return data;
    }, {} as { [data: string]: WallSegment[] });


    fs.writeFileSync("./play.corners.json", JSON.stringify(corners, null, 2));


    // in each corner, we should have AT MOST 2 walls
    // single points indicate wall ends

    const wallPaths: WallSegment[] = [];

    for (const cornerId in corners) {
        if (Object.prototype.hasOwnProperty.call(corners, cornerId)) {
            const corner = corners[cornerId];

            if (corner.length === 1) {
                // end segment
                if (cornerId === corner[0].leftId) {
                    // start new path
                    wallPaths.push(corner[0]);
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

    // at this point we should have segments linked
    // lets traverse links and adjust depth points

    for (const wallPath of wallPaths) {

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
                //dy = -dy;
            }

            // 90   +/-
            // -90  -/-

            console.info(JSON.stringify({
                Lo: leftWall.orientation,
                Ro: rightWall.orientation,
                L: leftWall.thickness,
                R: rightWall.thickness,
                LRd,
                Lsm,
                Rsm,
                f,
                RRd,
                fd,
                dx,
                dy

            }, null, 2))

            leftWall.right.xd = leftWall.right.x + dx;
            leftWall.right.yd = leftWall.right.y - dy;

            rightWall.left.xd = leftWall.right.xd;
            rightWall.left.yd = leftWall.right.yd;


            current = current.rightSegment;
        }
    }
}

interface WallSegment {
    leftSegment?: WallSegment;
    leftId: string;
    rightSegment?: WallSegment;
    rightId: string;
    wall: WallElement;
}


//\d+((\.\d+)|(\-(\d+)\/(2|4|8|16)+))?('|"|ft|in)

// 9"
// 10.22'
// 12.23ft
// 13.24"
// 15.26in
// 16.27' 17.28"
// 18.29ft 19.30in
// 10-1/2'
// 12-3/8ft
// 12-4/16ft
// 13-5/2"
// 15-7/8in
// 16-8/16' 17-9/2"
// 18-10/4ft 19-11/8in




const bd = fs.readFileSync("../play.raw.yml");
const strData = (bd ?? "").toString();


// const strData = YAML.stringify(data, {

// });

//fs.writeFileSync("./play.raw.yml", strData);

const data2 = YAML.parse(strData);

fs.writeFileSync("./play.raw.json", JSON.stringify(data2, null, 2));
//console.info(strData);


const ooo = processData(data2);
fs.writeFileSync("./play.data.json", JSON.stringify(ooo, null, 2));
wallConnections(ooo);
fs.writeFileSync("./play.data.updated.json", JSON.stringify(ooo, null, 2));

//console.info(JSON.stringify(ooo, null, 2));

const svg = buildSvg(ooo);
fs.writeFileSync("./play.svg", svg);

const svg2 = buildSvg2(ooo);
fs.writeFileSync("./play2.svg", svg2);

/*

bayWindow
panels: 3
length: 10'
depth: 3'
    -panel length
    -panel length
    -panel length







*/