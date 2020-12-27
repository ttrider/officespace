

export const parseErrors = {
    ERR001: (offset?: number) => new ParseError("ERR001", "Empty value", "", offset ?? 0),
    ERR002: (value: string, offset?: number) => new ParseError("ERR002", `Invalid format: ${value}`, value, offset ?? 0),

}


export class ParseError extends Error {
    code: string;
    inputValue: string;
    offset: number;

    constructor(code: string, message: string, inputValue = "", offset = 0) {
        super(message);
        this.code = code;
        this.inputValue = inputValue;
        this.offset = offset;
    }






}