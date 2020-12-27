import { parseLength } from "./utils";
import { Element, SpaceElement } from "./dom";



export class Context {

    elements: { [name: string]: Element } = {};

    innerWallThickness = parseLength("4-1/4\"");
    innerWallHeight = parseLength("9'");

    // constructor(){

    // }

    get spaces() {

        const spaces: SpaceElement[] = [];
        for (const key in this.elements) {
            if (Object.prototype.hasOwnProperty.call(this.elements, key)) {
                const element = this.elements[key];
                if (element.type === "space") {
                    spaces.push(element as SpaceElement);
                }

            }
        }
        return spaces;
    }

}