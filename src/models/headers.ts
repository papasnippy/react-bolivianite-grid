import { Header } from './header';
import { HeaderType } from '../index';

export interface IHeadersProps {
    /** Column header height. */
    headersHeight: number;

    /** Row header width. */
    headersWidth: number;

    columns: number | Header[];
    rows: number | Header[];
    columnWidth: number;
    rowHeight: number;

    leftLevels?: { [level: number]: number };
    topLevels?: { [level: number]: number };
}

export class HeadersContainer {
    private static _create<T extends Header>(list: T[], out: T[], cmp?: (h: T) => boolean) {
        list.forEach((h) => {
            if (cmp && !cmp(h)) {
                return;
            }

            if ((h.children && h.children.length)) {
                HeadersContainer._create(h.children, out, cmp);
                return;
            }

            out.push(h);
        });

        return out;
    }

    /**
     * Map function to inverse tree, `compare` function can be used to cut tree branches.
     *
     * Returns list of last leaves of provided tree.
     */
    static create<T extends Header>(list: T[], compare?: (h: T) => boolean) {
        return HeadersContainer._create(list, [], compare);
    }

    private static _defaultIdCounter = 0;

    // Default row and column sizes
    public readonly columnWidth: number;
    public readonly rowHeight: number;

    private _columns: Header[];
    private _rows: Header[];

    private _viewTopLevels = 0;
    private _viewLeftLevels = 0;

    private _levelHeight = 0;
    private _levelWidth = 0;
    private _topLevelSizes: { [level: number]: number };
    private _leftLevelSizes: { [level: number]: number };
    private _idMap: { [id: string]: Header; } = {};
    private _headersWidth = 0;
    private _headersHeight = 0;

    constructor(private _props: IHeadersProps) {
        const {
            columns, rows, columnWidth, rowHeight, headersHeight, headersWidth, leftLevels, topLevels
        } = _props;

        this._levelHeight = headersHeight;
        this._levelWidth = headersWidth;
        this.columnWidth = columnWidth;
        this.rowHeight = rowHeight;

        this._leftLevelSizes = { ...(leftLevels || {}) };
        this._topLevelSizes = { ...(topLevels || {}) };

        if (typeof columns === 'number') {
            this._columns = new Array(columns).fill(null).map(() => new Header(HeadersContainer._defaultIdCounter++, columnWidth));
        } else {
            this._columns = columns;
        }

        if (typeof rows === 'number') {
            this._rows = new Array(rows).fill(null).map(() => new Header(HeadersContainer._defaultIdCounter++, rowHeight));
        } else {
            this._rows = rows;
        }

        this.calcPosition();
    }

    public get topLevels() {
        return this._viewTopLevels;
    }

    public get leftLevels() {
        return this._viewLeftLevels;
    }

    public get headersWidth() {
        return this._headersWidth;
    }

    public get headersHeight() {
        return this._headersHeight;
    }

    public get columns() {
        return this._columns;
    }

    public get rows() {
        return this._rows;
    }

    private _calcParentPosition(list: Header[], type: HeaderType) {
        let lock: { [k: string]: boolean } = {};
        let parents: Header[] = [];

        list.forEach((h) => {
            this._idMap[h.id] = h;

            h._type = type;

            let first = h.children[0];
            let last = h.children[h.children.length - 1];

            h._position = first._position;
            h.size = last._position + last.size - first._position;

            if (h.parent && !lock[h.parent.id]) {
                lock[h.parent.id] = true;
                parents.push(h.parent);
            }
        });

        if (parents.length) {
            this._calcParentPosition(parents, type);
        }
    }

    private _proceedHeaders(list: Header[], from: number, size: number, type: HeaderType) {
        let cursor = list[from]._position;
        let len = list.length;

        if (!len) {
            return 0;
        }

        let levels = 0;
        let lock: { [k: string]: boolean } = {};
        let parents: Header[] = [];

        for (let i = from; i < len; i++) {
            let h = list[i];
            if (!h.size) {
                h.size = size;
            }

            h._index = (h.children && h.children[0]) ? -1 : i;
            h._position = cursor;
            cursor += h.size;

            h._type = type;

            let l = h._updateLevel();

            if (l > levels) {
                levels = l;
            }

            this._idMap[h.id] = h;

            if (h.parent && !lock[h.parent.id]) {
                lock[h.parent.id] = true;
                parents.push(h.parent);
            }
        }

        if (parents.length) {
            this._calcParentPosition(parents, type);
        }

        return levels + 1;
    }

    private _getLevelPosition(type: 'left' | 'top', level: number) {
        if (level >= (type === 'left' ? this._viewLeftLevels : this._viewTopLevels)) {
            return 0;
        }

        let p = 0;
        for (let i = 0; i < level; i++) {
            p += (type === 'left' ? this.getLeftLevelWidth(i) : this.getTopLevelHeight(i));
        }

        return p;
    }

    public getHeader(id: number | string) {
        return this._idMap[id];
    }

    public getTopLevelPosition(level: number) {
        return this._getLevelPosition('top', level);
    }

    public getLeftLevelPosition(level: number) {
        return this._getLevelPosition('left', level);
    }

    public getLeftLevelWidth(level: number) {
        let v = this._leftLevelSizes[level];
        return v == null ? this._levelWidth : v;
    }

    public getTopLevelHeight(level: number) {
        let v = this._topLevelSizes[level];
        return v == null ? this._levelHeight : v;
    }

    public calcPosition(from = 0) {
        this._viewLeftLevels = this._proceedHeaders(this._rows, from, this.rowHeight, HeaderType.Row);
        this._viewTopLevels = this._proceedHeaders(this._columns, from, this.columnWidth, HeaderType.Column);

        this._headersWidth = 0;
        for (let i = 0; i < this._viewLeftLevels; i++) {
            this._headersWidth += this.getLeftLevelWidth(i);
        }

        this._headersHeight = 0;
        for (let i = 0; i < this._viewTopLevels; i++) {
            this._headersHeight += this.getTopLevelHeight(i);
        }

        return this;
    }

    public update({
        rows, columns, leftLevels, topLevels
    }: {
        rows?: Header[],
        columns?: Header[],
        leftLevels?: { [level: number]: number; },
        topLevels?: { [level: number]: number; }
    } = {}) {
        let h = new HeadersContainer({
            ...this._props,
            rows: rows || this._rows,
            columns: columns || this._columns,
            leftLevels: {
                ...this._leftLevelSizes,
                ...(leftLevels || {})
            },
            topLevels: {
                ...this._topLevelSizes,
            ...(topLevels || {})
            }
        });

        return h;
    }

    public toJSON() {
        return {
            columns: this.columns,
            rows: this.rows,
            columnWidth: this.columnWidth,
            rowHeight: this.rowHeight,
            topLevels: this.topLevels,
            leftLevels: this.leftLevels,
            headersWidth: this.headersWidth,
            headersHeight: this.headersHeight
        };
    }
}
