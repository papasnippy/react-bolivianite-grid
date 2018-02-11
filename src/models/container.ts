import { HeaderType } from '../index';
import { IHeader } from './header';

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
    viewColumns: IHeader[];
    viewRows: IHeader[];
    viewLeftLevels: number;
    viewTopLevels: number;
    leftLevels: { [level: number]: number };
    topLevels: { [level: number]: number };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    types: { [headerId: string]: HeaderType };
    indices: { [headerId: string]: number };
    positions: { [headerId: string]: number };
    levels: { [headerId: string]: number };
    parents: { [headerId: string]: IHeader };
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
            viewColumns: null,
            viewRows: null,
            viewLeftLevels: 0,
            viewTopLevels: 0,
            leftLevels: {},
            topLevels: {},
            types: {},
            indices: {},
            positions: {},
            levels: {},
            parents: {}
        };

        this._state.viewColumns = this._create(props.columns, [], HeaderType.Column, props.filter);
        this._state.viewRows = this._create(props.rows, [], HeaderType.Row, props.filter);

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
            columns: this.columns,
            rows: this.rows
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
            h.$id = h.$id || ++this._idCounter;

            this._state.positions[h.$id] = 0;

            if (assignParent) {
                this._state.parents[h.$id] = assignParent;
            }

            if (h.$collapsed || (filter && !filter(h, type))) {
                return;
            }

            if ((h.$children && h.$children.length)) {
                this._create(h.$children, out, type, filter, h);
                return;
            }

            out.push(h);
        });

        return out;
    }

    private _createClone() {
        let c = new HeadersContainer(null);

        c._state = {
            ...this._state,
            leftLevels: { ...this._state.leftLevels },
            topLevels: { ...this._state.topLevels },
            types: { ...this._state.types },
            indices: { ...this._state.indices },
            positions: { ...this._state.positions },
            levels: { ...this._state.levels },
            parents: { ...this._state.parents }
        };

        return c;
    }

    private _applyHeaderLevel(h: IHeader) {
        let level = 0;
        let seek = h;

        while (this._state.parents[seek.$id]) {
            level++;
            seek = this._state.parents[seek.$id];
        }

        this._state.levels[h.$id] = level;

        if (this._state.parents[h.$id]) {
            this._applyHeaderLevel(this._state.parents[h.$id]);
        }

        return level;
    }

    private _applyParentPosition(list: IHeader[], type: HeaderType) {
        let lock: { [k: string]: boolean } = {};
        let parents: IHeader[] = [];

        list.forEach((h) => {
            this._idMap[h.$id] = h;
            this._state.types[h.$id] = type;

            let first = h.$children[0];
            let last = h.$children[h.$children.length - 1];

            this._state.positions[h.$id] = this._state.positions[first.$id];
            h.$size = this._state.positions[last.$id] + last.$size - this._state.positions[first.$id];

            let parent = this._state.parents[h.$id];

            if (parent && !lock[parent.$id]) {
                lock[parent.$id] = true;
                parents.push(parent);
            }
        });

        if (parents.length) {
            this._applyParentPosition(parents, type);
        }
    }

    private _proceedHeaders(list: IHeader[], from: number, size: number, type: HeaderType) {
        let cursor = this._state.positions[list[from].$id];
        let len = list.length;

        if (!len) {
            return 0;
        }

        let levels = 0;
        let lock: { [k: string]: boolean } = {};
        let parents: IHeader[] = [];

        for (let i = from; i < len; i++) {
            let h = list[i];

            if (!h.$size) {
                h.$size = size;
            }

            this._state.indices[h.$id] = (h.$children && h.$children[0]) ? -1 : i;
            this._state.positions[h.$id] = cursor;
            cursor += h.$size;

            this._state.types[h.$id] = type;

            let l = this._applyHeaderLevel(h);

            if (l > levels) {
                levels = l;
            }

            this._idMap[h.$id] = h;

            let parent = this._state.parents[h.$id];
            if (parent && !lock[parent.$id]) {
                lock[parent.$id] = true;
                parents.push(parent);
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
        if (!h.$children || !h.$children.length) {
            out.push(h);
            return out;
        }

        h.$children.forEach(c => this._getLeaves(c, out));
        return out;
    }

    private _getResizeList(h: IHeader, size: number, clamp?: (size: number) => number) {
        if ((!h.$children || !h.$children.length) && clamp) {
            size = clamp(size);
        }

        let prevSize = h.$size;

        if (!h.$children || !h.$children.length) {
            return [{
                header: h,
                size
            }];
        }

        let leaves = this.getHeaderLeaves(h);

        let d = 0;

        if (clamp) {
            leaves.forEach((c) => {
                let n = Math.floor(c.$size * size / prevSize);
                let m = clamp(n - d);

                if (n < m) {
                    d += m - n;
                }
            });
        }

        return leaves.map((c) => {
            return {
                header: c,
                size: clamp(Math.floor(c.$size * size / prevSize) - d)
            };
        });
    }

    private _getHeaderAddress(h: IHeader) {
        let ix: number[] = [];
        let seek = h;

        while (seek) {
            ix.push(this._state.indices[h.$id]);
            seek = this._state.parents[seek.$id];
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
                $children: this._mapBranch(address.slice(1), h.$children, map)
            };
        });
    }

    private _recalcHeaders() {
        this._state.viewColumns = null;
        this._state.viewRows = null;
        this._state.viewLeftLevels = 0;
        this._state.viewTopLevels = 0;
        this._state.viewColumns = this._create(this._state.columns, [], HeaderType.Column, this._state.filter);
        this._state.viewRows = this._create(this._state.rows, [], HeaderType.Row, this._state.filter);
        this._calcPosition();
        this._calcLevels();

        return this;
    }

    private _updateHeaders(
        branchMap: {
            [branchName: string]: {
                [$id: string]: IHeader;
            };
        },
        sourceList: IHeader[]
    ) {
        let branchList = Object.keys(branchMap);

        if (!branchList.length) {
            return sourceList;
        }

        branchList.forEach((branch) => {
            let address = branch.split('/').map(Number);
            let updateMap = branchMap[branch];

            sourceList = this._mapBranch(address, sourceList, (h) => {
                let update = updateMap[h.$id];

                if (!update) {
                    return h;
                }

                let next = { ...h };

                Object.keys(update).forEach((key) => {
                    if (key === '$id') {
                        return;
                    }

                    next[key] = update[key];
                });

                return next;
            });
        });

        return sourceList;
    }

    public getHeader(id: number | string) {
        return this._idMap[id];
    }

    public getHeaderType(h: IHeader) {
        return this._state.types[h.$id];
    }

    public getViewIndex(h: IHeader) {
        return this._state.indices[h.$id];
    }

    public getPosition(h: IHeader) {
        return this._state.positions[h.$id];
    }

    public getLevel(h: IHeader) {
        return this._state.levels[h.$id];
    }

    public getParent(h: IHeader) {
        return this._state.parents[h.$id];
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

    public getSource() {
        return {
            columns: this._state.columns,
            rows: this._state.rows,
            columnWidth: this._state.columnWidth,
            rowHeight: this._state.rowHeight,
            headersHeight: this._state.headersHeight,
            headersWidth: this._state.headersWidth,
            filter: this._state.filter
        } as IContainerProps;
    }

    public updateHeaders(updates: { header: IHeader, update: IHeader }[]) {
        let mapColumns: {
            [branchName: string]: {
                [$id: string]: IHeader;
            };
        } = {};

        let mapRows: typeof mapColumns = {};

        updates.forEach(({ header, update }) => {
            let headerType = this._state.types[header.$id];
            let address = this._getHeaderAddress(header);
            let map = headerType === HeaderType.Column ? mapColumns : mapRows;
            let branchName = address.slice(0, address.length - 1).join('/');

            if (!map[branchName]) {
                map[branchName] = {};
            }

            map[branchName][header.$id] = update;
        });

        let next = this._createClone();

        next._state.columns = this._updateHeaders(mapColumns, next._state.columns);
        next._state.rows = this._updateHeaders(mapRows, next._state.rows);

        return next._recalcHeaders();
    }

    public resizeHeaders(list: { header: IHeader, size: number }[], min = 5, max = Infinity) {
        let updates: { header: IHeader, update: IHeader }[] = [];

        list.forEach((u) => {
            let resizeList = this._getResizeList(u.header, u.size, (sz: number) => Math.min(Math.max(min, sz), max));

            resizeList.forEach(({ header, size }) => {
                updates.push({
                    header,
                    update: {
                        $size: size
                    }
                });
            });
        });

        return this.updateHeaders(updates);
    }

    public resizeLevel(type: HeaderType, level: number, size: number, min = 5, max = Infinity) {
        let t: 'leftLevels' | 'topLevels' = type === HeaderType.Column ? 'topLevels' : 'leftLevels';
        if (size <= min) {
            size = min;
        }

        let next = this._createClone();

        next._state[t][level] = Math.min(Math.max(min, size), max);
        next._calcLevels();

        return next;
    }
}
