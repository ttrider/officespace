import { parseErrors } from "./errors";


export function safeCos(angle: number) {
    let cosA = Math.cos(angle * (Math.PI / 180));
    if (Math.abs(cosA) < 0.000001) {
        cosA = 0;
    }
    return roundToPrecision(cosA);
}

export function safeSin(angle: number) {
    let sinA = Math.sin(angle * (Math.PI / 180));
    if (Math.abs(sinA) < 0.000001) {
        sinA = 0;
    }
    return roundToPrecision(sinA);
}

export function safeAcos(value: number) {
    const ang = Math.acos(value) / (Math.PI / 180);

    return roundToPrecision(ang);
}


export function splitLengthIntoParts(input: string) {
    const inputParts = input.split(" ");
    const parts = (inputParts.reduce((val, item) => {
        val.parts.push({
            value: item.toLowerCase(),
            offset: val.total
        });
        val.total += (item.length + 1);
        return val;
    }, { parts: [] as { value: string, offset: number }[], total: 0 }))
        .parts.filter(item => item.value.trim().length > 0);

    return parts;
}

export function roundToPrecision(value: number) {
    return Math.round(value * 10000) / 10000;
}
export function normalizeOrientation(angle: number) {
    angle = angle % 360;

    // force it to be the positive remainder, so that 0 <= angle < 360  
    angle = (angle + 360) % 360;

    // force into the minimum absolute value residue class, so that -180 < angle <= 180  
    if (angle > 180) { angle -= 360; }
    return angle;
}


export function parseLength(input?: string, supportDirection?: boolean) {
    if (!input) { throw parseErrors.ERR001() }

    // split into parts
    const parts = splitLengthIntoParts(input);
    if (parts.length === 0) {
        throw parseErrors.ERR001();
    }

    const lengthParts: number[] = [];
    let reverse = false;

    for (const item of parts) {
        const inputPart = item.value;

        if (supportDirection && inputPart === "left") {
            reverse = true;
            continue;
        } else if (supportDirection && inputPart === "right") {
            reverse = false;
            continue;
        }

        const regex = /(\d+)((\.\d+)|(-(\d+)\/(2|4|8|16)+))?('|"|ft|in)/i;

        const match = regex.exec(inputPart);
        if (!match) {
            throw parseErrors.ERR002(item.value, item.offset);
        }

        // group 1: whole number part
        let valNum = parseInt(match[1]);
        if (isNaN(valNum)) {
            throw parseErrors.ERR002(item.value, item.offset);
        }

        // decimal part
        if (match[3]) {
            const decNum = parseFloat("0" + match[3]);
            if (isNaN(decNum)) {
                throw parseErrors.ERR002(item.value, item.offset);
            }
            valNum += decNum;
        } else if (match[4]) {
            // we have fractional part
            const dt = parseFloat(match[5]);
            if (isNaN(dt)) {
                throw parseErrors.ERR002(item.value, item.offset);
            }
            const db = parseFloat(match[6]);
            if (isNaN(db)) {
                throw parseErrors.ERR002(item.value, item.offset);
            }

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
                throw parseErrors.ERR002(item.value, item.offset);
        }
        lengthParts.push(valNum);
    }

    const totalLength = roundToPrecision(lengthParts.reduce((sum, item) => sum + item, 0));
    return reverse ? -totalLength : totalLength;
}

export function parseAngle(input?: string) {
    if (!input) { throw parseErrors.ERR001() }

    const regex = /(-)?(([0-9]{1,3})|(@[\w]+))(\s?deg?(\s((cw)|(ccw)|(left)|(right)))?)?/gm;

    const match = regex.exec(input.trim().toLowerCase());
    if (!match) {
        throw parseErrors.ERR002(input, 0);
    }

    if (match[4]) {
        throw new Error("unsupported mode with variables");
    }

    if (!match[3]) {
        throw parseErrors.ERR003(input, 0);
    }

    let value = parseInt(match[3]);
    if (isNaN(value)) {
        throw parseErrors.ERR003(input, 0);
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

    return value;
}