import { HeaderType } from '../index';
import { IHeader, headerToJSON } from './header';

const HeaderStrictKeys: { [k: string]: boolean } = {
    id: true,
    type: true,
    position: true,
    index: true,
    level: true,
    parent: true
};

export interface IContainerProps {
    rows: IHeader[];
    columns: IHeader[];

    columnWidth: number;
    rowHeight: number;
    headersHeight: number;
    headersWidth: number;

    filter?: (h: IHeader, type: HeaderType) => boolean;
}

export interface IContainerState extends IContainerProps {
    viewRows: IHeader[];
    viewColumns: IHeader[];
    leftLevels: { [level: number]: number };
    topLevels: { [level: number]: number };
    viewLeftLevels: number;
    viewTopLevels: number;
}

export class HeadersContainer {
    private _idCounter = 0;
    private _state: IContainerState;
    private _idMap: { [id: string]: IHeader; } = {};
    private _headersWidth = 0;
    private _headersHeight = 0;

    constructor(props: IContainerProps) {
        if (!props) {
            return;
        }

        this._state = {
            ...props,
            viewColumns: this._create(props.columns, [], HeaderType.Column, props.filter),
            viewRows: this._create(props.rows, [], HeaderType.Row, props.filter),
            leftLevels: {},
            topLevels: {},
            viewLeftLevels: 0,
            viewTopLevels: 0
        };

        this._calcPosition();
        this._calcLevels();
    }

    get headersWidth() {
        return this._headersWidth;
    }

    get headersHeight() {
        return this._headersHeight;
    }

    get topLevels() {
        return this._state.viewTopLevels;
    }

    get leftLevels() {
        return this._state.viewLeftLevels;
    }

    get columns() {
        return this._state.viewColumns;
    }

    get rows() {
        return this._state.viewRows;
    }

    toJSON() {
        return {
            headersWidth: this.headersWidth,
            headersHeight: this.headersHeight,
            topLevels: this.topLevels,
            leftLevels: this.leftLevels,
            columns: this.columns,
            rows: this.rows,
            sourceColumns: this._state.columns,
            sourceRows: this._state.rows
        };
    }

    private _create(
        list: IHeader[],
        out: IHeader[],
        type: HeaderType,
        filter?: (h: IHeader, type: HeaderType) => boolean,
        assignParent?: IHeader
    ) {
        list.forEach((h) => {
            h.id = this._idCounter++;
            h.toJSON = headerToJSON;

            if (h.position == null) {
                h.position = 0;
            }

            if (assignParent) {
                h.parent = assignParent;
            }

            if (h.collapsed || (filter && !filter(h, type))) {
                return;
            }

            if ((h.children && h.children.length)) {
                this._create(h.children, out, type, filter, h);
                return;
            }

            out.push(h);
        });

        return out;
    }

    private _applyHeaderLevel(h: IHeader) {
        let level = 0;
        let seek = h;

        while (seek.parent) {
            level++;
            seek = seek.parent;
        }

        h.level = level;

        if (h.parent) {
            this._applyHeaderLevel(h.parent);
        }

        return level;
    }

    private _applyParentPosition(list: IHeader[], type: HeaderType) {
        let lock: { [k: string]: boolean } = {};
        let parents: IHeader[] = [];

        list.forEach((h) => {
            this._idMap[h.id] = h;

            h.type = type;

            let first = h.children[0];
            let last = h.children[h.children.length - 1];

            h.position = first.position;
            h.size = last.position + last.size - first.position;

            if (h.parent && !lock[h.parent.id]) {
                lock[h.parent.id] = true;
                parents.push(h.parent);
            }
        });

        if (parents.length) {
            this._applyParentPosition(parents, type);
        }
    }

    private _proceedHeaders(list: IHeader[], from: number, size: number, type: HeaderType) {
        let cursor = list[from].position;
        let len = list.length;

        if (!len) {
            return 0;
        }

        let levels = 0;
        let lock: { [k: string]: boolean } = {};
        let parents: IHeader[] = [];

        for (let i = from; i < len; i++) {
            let h = list[i];

            if (!h.size) {
                h.size = size;
            }

            h.index = (h.children && h.children[0]) ? -1 : i;
            h.position = cursor;
            cursor += h.size;

            h.type = type;

            let l = this._applyHeaderLevel(h);

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
            this._applyParentPosition(parents, type);
        }

        return levels + 1;
    }

    private _calcLevels() {
        this._headersWidth = 0;
        for (let i = 0; i < this._state.viewLeftLevels; i++) {
            this._headersWidth += this.getLeftLevelWidth(i);
        }

        this._headersHeight = 0;
        for (let i = 0; i < this._state.viewTopLevels; i++) {
            this._headersHeight += this.getTopLevelHeight(i);
        }
    }

    private _calcPosition(from = 0) {
        this._state.viewTopLevels = this._proceedHeaders(this._state.viewColumns, from, this._state.columnWidth, HeaderType.Column);
        this._state.viewLeftLevels = this._proceedHeaders(this._state.viewRows, from, this._state.rowHeight, HeaderType.Row);
    }

    private _getLevelPosition(type: 'left' | 'top', level: number) {
        if (level >= (type === 'left' ? this._state.viewLeftLevels : this._state.viewTopLevels)) {
            return 0;
        }

        let p = 0;
        for (let i = 0; i < level; i++) {
            p += (type === 'left' ? this.getLeftLevelWidth(i) : this.getTopLevelHeight(i));
        }

        return p;
    }

    private _getLeaves(h: IHeader, out: IHeader[] = []) {
        if (!h.children || !h.children.length) {
            out.push(h);
            return out;
        }

        h.children.forEach(c => this._getLeaves(c, out));
        return out;
    }

    private _getResizeList(h: IHeader, size: number, clamp?: (size: number) => number) {
        if ((!h.children || !h.children.length) && clamp) {
            size = clamp(size);
        }

        let prevSize = h.size;

        if (!h.children || !h.children.length) {
            return [{
                header: h,
                size
            }];
        }

        let leaves = this.getHeaderLeaves(h);

        let d = 0;

        if (clamp) {
            leaves.forEach((c) => {
                let n = Math.floor(c.size * size / prevSize);
                let m = clamp(n - d);

                if (n < m) {
                    d += m - n;
                }
            });
        }

        return leaves.map((c) => {
            return {
                header: c,
                size: clamp(Math.floor(c.size * size / prevSize) - d)
            };
        });
    }

    private _getHeaderAddress(h: IHeader) {
        let ix: number[] = [];
        let seek = h;

        while (seek) {
            ix.push(seek.index);
            seek = seek.parent;
        }

        return ix.reverse();
    }

    private _mapBranch(address: number[], list: IHeader[], map: (h: IHeader) => IHeader): IHeader[] {
        let len = address.length;

        return list.map((h) => {
            if (!len) {
                return map(h);
            }

            return {
                ...h,
                children: this._mapBranch(address.slice(1), h.children, map)
            };
        });
    }

    private _updateHeader(address: number[], list: IHeader[], update: { [k: string]: any } ): IHeader[] {
        let len = address.length;

        if (!len) {
            return list;
        }

        let ix = address[len - 1];
        address = address.slice(0, len - 1);

        return this._mapBranch(address, list, (h) => {
            if (h.index !== ix) {
                return h;
            }

            let copy = { ...h };

            Object.keys(update).forEach((k) => {
                if (HeaderStrictKeys[k]) {
                    return;
                }

                copy[k] = update[k];
            });

            return copy;
        });
    }

    private _updateHeaderLine(t: 'rows' | 'columns', headers: IHeader[]) {
        let s = {
            rows: this._state.rows,
            columns: this._state.columns
        };

        s[t] = headers;

        let next = new HeadersContainer(null);

        next._state = {
            ...this._state,
            ...s,
            viewColumns: next._create(s.columns, [], HeaderType.Column, this._state.filter),
            viewRows: next._create(s.rows, [], HeaderType.Row, this._state.filter),
        };

        next._calcPosition();
        next._calcLevels();

        return next;
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
        let v = this._state.leftLevels[level];
        return v == null ? this._state.headersWidth : v;
    }

    public getTopLevelHeight(level: number) {
        let v = this._state.topLevels[level];
        return v == null ? this._state.headersHeight : v;
    }

    public getHeaderLeaves(h: IHeader) {
        return this._getLeaves(h);
    }

    public updateHeader(header: IHeader, update: { [k: string]: any }) {
        let address = this._getHeaderAddress(header);
        let t: 'rows' | 'columns' = header.type === HeaderType.Column ? 'columns' : 'rows';

        return this._updateHeaderLine(t, this._updateHeader(address, this._state[t], update));
    }

    public resizeHeader(header: IHeader, size: number, min = 5, max = Infinity) {
        if (size <= min) {
            size = min;
        }

        let list = this._getResizeList(header, size, (sz: number) => Math.min(Math.max(min, sz), max));

        if (!list.length) {
            return;
        }

        let address = this._getHeaderAddress(list[0].header);
        address.pop();

        let m: {
            [h: number]: number;
        } = {};

        list.forEach((u, i) => {
            m[u.header.index] = i;
        });

        let t: 'rows' | 'columns' = header.type === HeaderType.Column ? 'columns' : 'rows';

        return this._updateHeaderLine(t, this._mapBranch(address, this._state[t], (h) => {
            if (m[h.index] == null) {
                return h;
            }

            return {
                ...h,
                size: list[m[h.index]].size
            };
        }));
    }

    public resizeLevel(type: HeaderType, level: number, size: number, min = 5, max = Infinity) {
        let t: 'leftLevels' | 'topLevels' = type === HeaderType.Column ? 'topLevels' : 'leftLevels';
        if (size <= min) {
            size = min;
        }

        let next = new HeadersContainer(null);

        next._state = {
            ...this._state,
            [t]: {
                ...this._state[t],
                [level]: Math.min(Math.max(min, size), max)
            }
        };

        next._calcLevels();

        return next;
    }
}
