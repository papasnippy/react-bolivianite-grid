import { Header } from '../src';

export class ExcelColumn extends Header {
    private static _id = 0;
    private _lastIndex = -1;
    private _caption = '';

    public children: ExcelColumn[];

    constructor(children?: ExcelColumn[], id?: number) {
        super(id != null ? id : ExcelColumn._id++);
        if (children) {
            this.children = children;
            this.children.forEach(c => c.parent = this);
        }
    }

    public print(index: number) {
        if (this._caption && index === this._lastIndex) {
            return this._caption;
        }

        this._lastIndex = index;

        index++;

        for (let a = 1, b = 26; (index -= a) >= 0; a = b, b *= 26) {
            this._caption = String.fromCharCode(~~((index % b) / a) + 65) + this._caption;
        }

        return this._caption;
    }
}

export default ExcelColumn;
