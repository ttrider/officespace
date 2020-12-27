import { SpaceElement, WallSegment } from "./dom";




export function renderSpaceTop(space: SpaceElement) {

    const mult = 10;

    let left = 0;
    let right = 0;
    let top = 0;
    let bottom = 0;

    const pathItem = space.wallSegments.map(ws => {

        const parts: string[] = [];

        let current: WallSegment | undefined = ws;

        parts.push(`M ${current.wall.left.x * mult},${current.wall.left.y * mult}`);

        while (current) {
            left = Math.min(left, current.wall.left.x, current.wall.right.x);
            right = Math.max(right, current.wall.left.x, current.wall.right.x);
            top = Math.min(top, current.wall.left.y, current.wall.right.y);
            bottom = Math.max(bottom, current.wall.left.y, current.wall.right.y);

            left = Math.min(left, current.wall.left.xd, current.wall.right.xd);
            right = Math.max(right, current.wall.left.xd, current.wall.right.xd);
            top = Math.min(top, current.wall.left.yd, current.wall.right.yd);
            bottom = Math.max(bottom, current.wall.left.yd, current.wall.right.yd);

            parts.push(`L ${current.wall.right.x * mult},${current.wall.right.y * mult}`);

            if (!current.rightSegment) {
                break;
            }

            current = current.rightSegment;
        }
        // go back
        //parts.push(`L ${current.wall.left.xd * mult},${current.wall.left.yd * mult}`);

        while (current) {

            parts.push(`L ${current.wall.right.xd * mult},${current.wall.right.yd * mult}`);

            if (!current.leftSegment) {
                break;
            }

            current = current.leftSegment;
        }
        parts.push(`L ${current.wall.left.xd * mult},${current.wall.left.yd * mult}`);
        parts.push(`z`);

        return `<path fill="#f0f0f0" stroke="black" d="${parts.join(" ")}"/>`;
    }).join("\n");

    const x = (left - 10) * mult;
    const y = (top - 10) * mult;
    const width = (Math.abs(right - left) + 20) * mult;
    const height = (Math.abs(bottom - top) + 20) * mult;

    const ret = `<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='${x} ${y} ${width} ${height}'>` +
        "\n" +
        `<rect fill="white" stroke="black" stroke-width="5" x="${x}" y="${y}" width="${width}" height="${height}" />` +
        "\n" +
        pathItem +
        "\n</svg>";

    return ret;

}
