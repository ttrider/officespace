import YAML from 'yaml'
import fs from "fs";
import { Element, SpaceElement, WallElement } from "./dom";
import { Context } from './context';
import { renderSpaceTop } from './render';



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


function processData(input: any) {

    const context = new Context();

    const spaces = input.spaces;

    for (const spaceName in spaces) {
        if (Object.prototype.hasOwnProperty.call(spaces, spaceName)) {
            const space = spaces[spaceName];

            const spaceElement = new SpaceElement(context, spaceName);
            context.elements[spaceElement.id] = spaceElement;

            if (space.floorPlan) {

                for (const fpItem of space.floorPlan) {

                    if (fpItem.$anchor) {
                        spaceElement.floorPlanParseContext.processAnchor(fpItem.$anchor);
                    } else if (fpItem.$rotate) {
                        spaceElement.floorPlanParseContext.processRotate(fpItem.$rotate);
                    } else if (fpItem.wall) {
                        spaceElement.floorPlanParseContext.processWall(fpItem.wall);
                    }
                }

                spaceElement.floorPlanParseContext.postProcessWalls();
            }
        }
    }

    return context;
}

const bd = fs.readFileSync("../play.raw.yml");
const strData = (bd ?? "").toString();


// const strData = YAML.stringify(data, {

// });

//fs.writeFileSync("./play.raw.yml", strData);

const data2 = YAML.parse(strData);

fs.writeFileSync("./play.raw.json", JSON.stringify(data2, null, 2));
//console.info(strData);

const context = processData(data2);

const space = context.spaces[0];

const svg = renderSpaceTop(space);
//console.info(JSON.stringify(ooo, null, 2));

// const svg = buildSvg(ooo);
 fs.writeFileSync("./play.svg", svg);

// const svg2 = buildSvg2(ooo);
// fs.writeFileSync("./play2.svg", svg2);
