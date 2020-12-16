import YAML from 'yaml'
import fs from "fs";


function roundLength(value: number) {
    return Math.floor(value * 10000) / 10000;
}

function parseLength(input?: string, supportDirection?: boolean) {
    if (!input) { throw new Error("empty length string"); }

    // split into parts
    const inputParts = input.trim().split(" ").filter(i => i);
    if (inputParts.length === 0) { throw new Error("empty length string"); }

    let lengthParts: number[] = [];

    for (let inputPart of inputParts) {
        inputPart = inputPart.trim().toLowerCase();

        if (supportDirection && inputPart === "left") {
            if (lengthParts.length === 0) {
                throw new Error("invalid length part: " + inputParts);
            }
            lengthParts[lengthParts.length - 1] = -lengthParts[lengthParts.length - 1];
            continue;
        } else if (supportDirection && inputPart === "right") {
            // do nothing
            continue;
        }

        const regex = /(\d+)((\.\d+)|(\-(\d+)\/(2|4|8|16)+))?('|"|ft|in)/i;

        const match = regex.exec(inputPart);
        if (!match) { throw new Error("invalid length part: " + inputParts); }

        // group 1: whole number part
        let valNum = parseInt(match[1]);
        if (isNaN(valNum)) { throw new Error("invalid length part: " + inputParts); }

        // decimal part
        if (match[3]) {
            const decNum = parseInt("0" + match[3]);
            if (isNaN(decNum)) { throw new Error("invalid length part: " + inputParts); }
            valNum += decNum;
        } else if (match[4]) {
            // we have fractional part
            const dt = parseInt(match[5]);
            if (isNaN(dt)) { throw new Error("invalid length part: " + inputParts); }
            const db = parseInt(match[6]);
            if (isNaN(db)) { throw new Error("invalid length part: " + inputParts); }

            valNum += (dt / db);
        }

        const units = match[7] ?? "";
        switch (units) {
            case "'":
            case "ft":
                // converting to inches
                valNum *= 12;
                break;
            case "\"":
            case "in":
                // do nothing
                break;
            default:
                throw new Error("invalid length part: " + inputParts);
        }
        lengthParts.push(valNum);
    }

    const totalLength = roundLength(lengthParts.reduce((sum, item) => sum + item, 0));
    return totalLength;
}

function calculateOffset(orientation: number, length: number) {
    let cosA = Math.cos(orientation * (Math.PI / 180));
    if (Math.abs(cosA) < 0.000001) {
        cosA = 0;
    }
    let sinA = Math.sin(orientation * (Math.PI / 180));
    if (Math.abs(sinA) < 0.000001) {
        sinA = 0;
    }

    const cx = roundLength(cosA ? length / cosA : 0);
    const cy = roundLength(sinA ? length / sinA : 0);
    return { cx, cy };
}

function buildSvg(data: { [name: string]: Element }) {

    const mult = 10;

    let left = 0;
    let right = 0;
    let top = 0;
    let bottom = 0;

    const lines: string[] = [];
    const anchors: string[] = [];

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

interface Element {
    type: string;
    idSet: string[];
}

interface SpaceElement extends Element {
    area?: number
}

interface AnchorElement extends Element {
    position: {
        x: number,
        y: number
    }
}

interface WallElement extends Element {
    left: {
        x: number,
        y: number,
        xd: number,
        yd: number,
        height: number
    };
    right: {
        x: number,
        y: number,
        xd: number,
        yd: number,
        height: number
    };
    length: number;
    thickness: number;
}


interface AnchorItem {
    name: string;
}

interface WallItem {

    name?: string;
    height?: string | { left: string; right: string };
    thickness?: string;
    length?: string;
    to?: string;
    from?: string;
    depth?: string;
}

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

                    console.info(JSON.stringify(current));
                    console.info(JSON.stringify(fpItem));


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
        current.orientation = current.orientation % 360;
    }

    function processWall(item: WallItem) {
        if (!item) return;

        const name = item.name ? item.name : "wall" + (current.lastIndex++).toString();

        const idSet = current.getIdSet(["wall", name]);

        const startPosition = {
            x: current.x,
            y: current.y,
            xd: 0,
            yd: 0,
            height: current.height
        }

        if (item.from) {
            // TODO detect start point and use it instead
            throw new Error("not implemented yet")
        }

        if (item.to) {
            throw new Error("not implemented yet");

        } else {

            let length = parseLength(item.length, true);

            const { cx, cy } = calculateOffset(current.orientation, length)

            //console.info(`length: ${length}`);

            // let cosA = Math.cos(current.orientation * (Math.PI / 180));
            // if (Math.abs(cosA) < 0.000001) {
            //     cosA = 0;
            // }
            // let sinA = Math.sin(current.orientation * (Math.PI / 180));
            // if (Math.abs(sinA) < 0.000001) {
            //     sinA = 0;
            // }

            // const cx = roundLength(cosA ? length / cosA : 0);
            // const cy = roundLength(sinA ? length / sinA : 0);


            const endPosition = {
                x: current.x + cx,
                y: current.y + cy,
                xd: 0,
                yd: 0,
                height: current.height
            }


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
            const depthOffset = calculateOffset(current.orientation + 90, current.wallThickness);

            left.xd = left.x + depthOffset.cx;
            left.yd = left.y + depthOffset.cy;
            right.xd = right.x + depthOffset.cx;
            right.yd = right.y + depthOffset.cy;

            objects[idSet.join(".")] = {
                type: "wall",
                idSet,
                left,
                right,
                length,
                thickness: current.wallThickness

            } as WallElement;
        }
    }


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

const data = {

    spaces: {

        "kitchen": {


            floorPlan: [
                {
                    "$anchor": "kitchenCorner"
                },
                {
                    "wall": {
                        "name": "pantrywall",
                        "height": "10'",
                        "thickness": "4-1/4\"",
                        "length": "36\" left"
                    }
                },
                { "$rotate": "90deg cw" },
                {
                    "wall": {
                        "length": "24\" left"
                    }
                },
                { $rotate: "90deg ccw" },
                {
                    "wall": {
                        "name": "cabinetWall",
                        "length": "150\" left",
                    }
                },
                { "$rotate": "90deg ccw" },
                {
                    "wall": {
                        "name": "diningWall",
                        "length": "130\" left",
                    }
                },
                { "$rotate": "90deg ccw" },
                {
                    "wall": {
                        "name": "windowWall",
                        "thickness": "6\"",
                        "length": "20\" left",
                    }
                },
                { "$anchor": "nookRightCorner" },
                {
                    "$anchor": {
                        name: "nookLeftCorner"
                    }
                },
                {
                    "$rotate": "45 deg cw"
                },
                {
                    "wall": {
                        "name": "nook1",
                        "length": "40in left"
                    }
                },
                { "$rotate": "-45 deg cw" },
                {
                    "wall": {
                        "name": "nook2",
                        "length": "40in left"
                    }
                },
                { "$rotate": "-45 deg cw" },
                {
                    "wall": {
                        "name": "nook3",
                        "length": "40in left"
                        // "to": "@anchor.nookLeftCorner"
                    }
                },

            ]


        }
    }
}



const strData = YAML.stringify(data, {

});

fs.writeFileSync("./play.raw.yml", strData);

fs.writeFileSync("./play.raw.json", JSON.stringify(data, null, 2));
//console.info(strData);


const ooo = processData(data);
fs.writeFileSync("./play.data.json", JSON.stringify(ooo, null, 2));

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