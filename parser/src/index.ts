import YAML from 'yaml'
import fs from "fs";
import { SpaceElement } from "./dom";
import { Context } from './context';
import { renderSpaceTop } from './render';



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

const data2 = YAML.parse(strData);

fs.writeFileSync("./play.raw.json", JSON.stringify(data2, null, 2));

const context = processData(data2);

const space = context.spaces[0];

const svg = renderSpaceTop(space);

 fs.writeFileSync("./play.svg", svg);

