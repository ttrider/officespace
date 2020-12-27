import { roundToPrecision, normalizeOrientation, parseLength, safeSin, safeCos, safeAcos } from "../src/utils";
import { splitLengthIntoParts } from "../src/utils";

describe("roundToPrecision", () => {

    test("r2p: 0", () => {
        expect(roundToPrecision(0)).toBe(0);
    });
    test("r2p: 110", () => {
        expect(roundToPrecision(110)).toBe(110);
    });
    test("r2p: -110", () => {
        expect(roundToPrecision(-110)).toBe(-110);
    });
    test("r2p: 12.3456", () => {
        expect(roundToPrecision(12.3456)).toBe(12.3456);
    });
    test("r2p: 12.34567", () => {
        expect(roundToPrecision(12.34567)).toBe(12.3457);
    });
    test("r2p: -12.3456", () => {
        expect(roundToPrecision(-12.3456)).toBe(-12.3456);
    });
    test("r2p: -12.34567", () => {
        expect(roundToPrecision(-12.34567)).toBe(-12.3457);
    });
});

describe("normalizeOrientation", () => {

    test("no: 0", () => {
        expect(normalizeOrientation(0)).toBe(0);
    });

    test("no: 10", () => {
        expect(normalizeOrientation(10)).toBe(10);
    });
    test("no: 90", () => {
        expect(normalizeOrientation(90)).toBe(90);
    });
    test("no: 179", () => {
        expect(normalizeOrientation(179)).toBe(179);
    });
    test("no: 180", () => {
        expect(normalizeOrientation(180)).toBe(180);
    });
    test("no: 190", () => {
        expect(normalizeOrientation(190)).toBe(-170);
    });
    test("no: 270", () => {
        expect(normalizeOrientation(270)).toBe(-90);
    });
    test("no: 359", () => {
        expect(normalizeOrientation(359)).toBe(-1);
    });
    test("no: 360", () => {
        expect(normalizeOrientation(360)).toBe(0);
    });
    test("no: 3601", () => {
        expect(normalizeOrientation(3601)).toBe(1);
    });
    test("no: -190", () => {
        expect(normalizeOrientation(-190)).toBe(170);
    });
    test("no: -270", () => {
        expect(normalizeOrientation(-270)).toBe(90);
    });
    test("no: -359", () => {
        expect(normalizeOrientation(-359)).toBe(1);
    });
    test("no: -360", () => {
        expect(normalizeOrientation(-360)).toBe(0);
    });
    test("no: -3601", () => {
        expect(normalizeOrientation(-3601)).toBe(-1);
    });

});

describe("splitLengthParts", () => {
    test("slp: abc", () => {
        const results = splitLengthIntoParts("abc");
        expect(results).toHaveLength(1);
        expect(results[0].value).toBe("abc");
        expect(results[0].offset).toBe(0);
    });

    test("slp: __abc_", () => {
        const results = splitLengthIntoParts("  abc ");
        expect(results).toHaveLength(1);
        expect(results[0].value).toBe("abc");
        expect(results[0].offset).toBe(2);
    });

    test("slp: __abc____def", () => {
        const results = splitLengthIntoParts("  Abc    Def");
        expect(results).toHaveLength(2);
        expect(results[0].value).toBe("abc");
        expect(results[0].offset).toBe(2);
        expect(results[1].value).toBe("def");
        expect(results[1].offset).toBe(9);
    });

});


describe("parseLength", () => {
    test(`pl: 9"`, () => { expect(parseLength(`9"`)).toBe(9); });
    test(`pl: 10.22'`, () => { expect(parseLength(`10.22'`)).toBe(122.64); });
    test(`pl: 12.23ft`, () => { expect(parseLength(`12.23ft`)).toBe(146.76); });
    test(`pl: 13.24"`, () => { expect(parseLength(`13.24"`)).toBe(13.24); });
    test(`pl: 15.26in`, () => { expect(parseLength(`15.26in`)).toBe(15.26); });
    test(`pl: 16.27' 17.28"`, () => { expect(parseLength(`16.27' 17.28"`)).toBe(212.52); });
    test(`pl: 18.29ft 19.30in`, () => { expect(parseLength(`18.29ft 19.30in`)).toBe(238.78); });
    test(`pl: 10-1/2'`, () => { expect(parseLength(`10-1/2'`)).toBe(126); });
    test(`pl: 12-3/8ft`, () => { expect(parseLength(`12-3/8ft`)).toBe(148.5); });
    test(`pl: 12-4/16ft`, () => { expect(parseLength(`12-4/16ft`)).toBe(147); });
    test(`pl: 13-5/2"`, () => { expect(parseLength(`13-5/2"`)).toBe(15.5); });
    test(`pl: 15-7/8in`, () => { expect(parseLength(`15-7/8in`)).toBe(15.875); });
    test(`pl: 16-8/16' 17-9/2"`, () => { expect(parseLength(`16-8/16' 17-9/2"`)).toBe(219.5); });
    test(`pl: 18-10/4ft 19-11/8in`, () => { expect(parseLength(`18-10/4ft 19-11/8in`)).toBe(266.375); });
});


describe("trigonometry", () => {
    test(`sin: 30`, () => { expect(safeSin(30)).toBe(0.5); });
    test(`cos: 60`, () => { expect(safeCos(60)).toBe(0.5); });
    test(`acos: 1`, () => { expect(safeCos(safeAcos(1))).toBe(1); });
});