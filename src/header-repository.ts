import { IHeader, HeaderType, HeaderResizeBehavior, HeaderFilter, HeaderClampFunction } from './types';
import { IHeaderRepositoryCache } from './header-repository-cache';

export interface IHeaderRepositoryProps {
    cache?: IHeaderRepositoryCache;
    rows: IHeader[];
    columns: IHeader[];
    columnWidth: number;
    rowHeight: number;
    headersHeight: number;
    headersWidth: number;
    filter?: HeaderFilter;
}

export interface IHeaderRepositoryState extends IHeaderRepositoryProps {
    viewColumns: IHeader[];
    viewRows: IHeader[];
    offsetWidth: number;
    offsetHeight: number;

    /** header's type */
    types: { [headerId: string]: HeaderType };

    /** header's parent */
    parents: { [headerId: string]: IHeader };

    /** header's position */
    positions: { [headerId: string]: number };

    /** header's index */
    indices: { [headerId: string]: number };

    /** header's level */
    levels: { [headerId: string]: number };

    // CACHED:
    /** maximum levels */
    viewLeftLevels: number;
    viewTopLevels: number;

    /** level sizes */
    leftLevels: { [level: number]: number };
    topLevels: { [level: number]: number };

    /** header manual resized flag */
    headerManualResized: Set<string | number>;

    /** level manual resized flag */
    levelManualResized: Set<string | number>;
}

export class HeaderRepository {
    private _idCounter = 0;
    private _state: IHeaderRepositoryState;
    private _idMap: { [id: string]: IHeader; } = {};

    constructor(props: IHeaderRepositoryProps) {
        if (!props) {
            return;
        }

        this._state = {
            ...props,
            offsetWidth: 0,
            offsetHeight: 0,
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
            parents: {},
            headerManualResized: new Set<string>(),
            levelManualResized: new Set<string>()
        };

        this._state.viewColumns = this._create(props.columns, [], HeaderType.Column, props.filter);
        this._state.viewRows = this._create(props.rows, [], HeaderType.Row, props.filter);

        this._calcPosition();
        this._calcLevels();
    }

    get columnWidth() {
        return this._state.columnWidth;
    }

    get rowHeight() {
        return this._state.rowHeight;
    }

    get headersHeight() {
        return this._state.headersHeight;
    }

    get headersWidth() {
        return this._state.headersWidth;
    }

    /** Total width of row headers. */
    get offsetWidth() {
        return (
            this._state.cache
                ? this._state.cache.getOffset('left')
                : this._state.offsetWidth
        );
    }

    /** Total height of column headers. */
    get offsetHeight() {
        return (
            this._state.cache
                ? this._state.cache.getOffset('top')
                : this._state.offsetHeight
        );
    }

    get topLevels() {
        return (
            this._state.cache
                ? this._state.cache.getLevels('top')
                : this._state.viewTopLevels
        );
    }

    get leftLevels() {
        return (
            this._state.cache
                ? this._state.cache.getLevels('left')
                : this._state.viewLeftLevels
        );
    }

    get columns() {
        return this._state.viewColumns;
    }

    get rows() {
        return this._state.viewRows;
    }

    toJSON() {
        return {
            source: {
                rows: this._state.rows,
                columns: this._state.columns,
            },
            view: {
                rows: this.rows,
                columns: this.columns,
            },
            settings: {
                columnWidth: this.columnWidth,
                rowHeight: this.rowHeight,
                headersHeight: this.headersHeight,
                headersWidth: this.headersWidth,
                canvasHeight: this.offsetHeight,
                canvasWidth: this.offsetWidth,
                topLevels: this.topLevels,
                leftLevels: this.leftLevels,
                filter: !!this._state.filter
            }
        };
    }

    private _create(
        list: IHeader[],
        out: IHeader[],
        type: HeaderType,
        filter?: HeaderFilter,
        assignParent?: IHeader
    ) {
        list.forEach((h) => {
            h.$id = h.$id || ++this._idCounter;

            this._state.positions[h.$id] = 0;

            if (assignParent) {
                this._state.parents[h.$id] = assignParent;
            }

            if (filter && !filter({ header: h, type })) {
                return;
            }

            if (!h.$collapsed && h.$children && h.$children.length) {
                this._create(h.$children, out, type, filter, h);
                return;
            }

            out.push(h);
        });

        return out;
    }

    private _createClone() {
        let c = new HeaderRepository(null);

        c._state = {
            ...this._state,
            leftLevels: { ...this._state.leftLevels },
            topLevels: { ...this._state.topLevels },
            types: { ...this._state.types },
            indices: { ...this._state.indices },
            positions: { ...this._state.positions },
            levels: { ...this._state.levels },
            parents: { ...this._state.parents },
            headerManualResized: new Set(this._state.headerManualResized),
            levelManualResized: new Set(this._state.levelManualResized)
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
        let lock = new Set<string | number>();
        let parents: IHeader[] = [];

        list.forEach((h) => {
            this._idMap[h.$id] = h;
            this._state.types[h.$id] = type;

            let first = h.$children[0];
            let last = h.$children[h.$children.length - 1];

            this._state.positions[h.$id] = this._state.positions[first.$id];
            h.$size = this._state.positions[last.$id] + this.getSize(last) - this._state.positions[first.$id];

            if (this._state.cache) {
                this._state.cache.setHeaderSize(h.$size, h, type);
            }

            let parent = this._state.parents[h.$id];

            if (parent && !lock.has(parent.$id)) {
                lock.add(parent.$id);
                parents.push(parent);
            }
        });

        if (parents.length) {
            this._applyParentPosition(parents, type);
        }
    }

    private _proceedHeaders(list: IHeader[], from: number, size: number, type: HeaderType) {
        let len = list.length;
        if (!len) {
            return 0;
        }

        let cursor = this._state.positions[list[from].$id];

        let levels = 0;
        let lock = new Set<string | number>();
        let parents: IHeader[] = [];

        for (let i = from; i < len; i++) {
            let h = list[i];

            this._state.indices[h.$id] = (!h.$collapsed && h.$children && h.$children[0]) ? -1 : i;
            this._state.positions[h.$id] = cursor;
            this._state.types[h.$id] = type;
            this._idMap[h.$id] = h;

            if (!h.$size) {
                if (this._state.cache) {
                    h.$size = this._state.cache.getHeaderSize(h, type) || size;
                } else {
                    h.$size = size;
                }
            }

            if (!h.$sizeCollapsed) {
                h.$sizeCollapsed = h.$size;
            }

            if (this._state.cache) {
                this._state.cache.setHeaderSize(h.$collapsed ? h.$sizeCollapsed : h.$size, h, type);
            }

            cursor += this.getSize(h);

            let l = this._applyHeaderLevel(h);

            if (l > levels) {
                levels = l;
            }

            let parent = this._state.parents[h.$id];
            if (parent && !lock.has(parent.$id)) {
                lock.add(parent.$id);
                parents.push(parent);
            }
        }

        if (parents.length) {
            this._applyParentPosition(parents, type);
        }

        return levels + 1;
    }

    private _calcLevels() {
        let w = 0, h = 0;

        for (let i = 0; i < this.leftLevels; i++) {
            w += this.getLeftLevelWidth(i);
        }

        for (let i = 0; i < this.topLevels; i++) {
            h += this.getTopLevelHeight(i);
        }

        this._state.offsetWidth = w || this._state.headersWidth;
        this._state.offsetHeight = h || this._state.headersHeight;

        if (this._state.cache) {
            this._state.cache.setOffset(this._state.offsetWidth, 'left');
            this._state.cache.setOffset(this._state.offsetHeight, 'top');
        }
    }

    private _calcPosition(from = 0) {
        this._state.viewTopLevels = this._proceedHeaders(this._state.viewColumns, from, this._state.columnWidth, HeaderType.Column);
        this._state.viewLeftLevels = this._proceedHeaders(this._state.viewRows, from, this._state.rowHeight, HeaderType.Row);

        if (this._state.cache) {
            this._state.cache.setLevels(this._state.viewLeftLevels, 'left');
            this._state.cache.setLevels(this._state.viewTopLevels, 'top');
        }
    }

    private _getLevelPosition(type: 'left' | 'top', level: number) {
        if (level >= (type === 'left' ? this.leftLevels : this.topLevels)) {
            return 0;
        }

        let p = 0;
        for (let i = 0; i < level; i++) {
            p += (type === 'left' ? this.getLeftLevelWidth(i) : this.getTopLevelHeight(i));
        }

        return p;
    }

    private _getLeaves(h: IHeader, out: IHeader[] = []) {
        if (h.$collapsed || !h.$children || !h.$children.length) {
            out.push(h);
            return out;
        }

        h.$children.forEach(c => this._getLeaves(c, out));
        return out;
    }

    private _getAllNodesByChildren(headers: IHeader[], lock = new Set<string | number>(), out: IHeader[] = []) {
        headers.forEach((h) => {
            if (!h) {
                return;
            }

            if (!lock.has(h.$id)) {
                out.push(h);
                lock.add(h.$id);
            }

            if (h.$children && h.$children.length) {
                this._getAllNodesByChildren(h.$children, lock, out);
            }
        });

        return out;
    }

    private _getAllNodesByParents(headers: IHeader[], lock = new Set<string | number>(), out: IHeader[] = []) {
        const seek = (h: IHeader) => {
            if (!h) {
                return;

            }

            if (!lock.has(h.$id)) {
                out.push(h);
                lock.add(h.$id);
            }

            seek(this.getParent(h));
        };

        headers.forEach((h) => {
            seek(h);
        });

        return out;
    }

    private _getResizeList(h: IHeader, size: number, clamp: HeaderClampFunction) {
        if (h.$collapsed || !h.$children || !h.$children.length) {
            size = clamp({
                header: h,
                type: this._state.types[h.$id],
                size
            });
        }

        let prevSize = this.getSize(h);

        if (h.$collapsed || !h.$children || !h.$children.length) {
            return [{
                header: h,
                size
            }];
        }

        let leaves = this.getHeaderLeaves(h);

        let d = 0;

        if (clamp) {
            leaves.forEach((c) => {
                let n = Math.floor(this.getSize(c) * size / prevSize);
                let m = clamp({
                    header: h,
                    type: this._state.types[h.$id],
                    size: n - d
                });

                if (n < m) {
                    d += m - n;
                }
            });
        }

        return leaves.map((c) => {
            return {
                header: c,
                size: clamp({
                    header: c,
                    type: this._state.types[c.id],
                    size: Math.floor(this.getSize(c) * size / prevSize) - d
                })
            };
        });
    }

    private _getHeaderAddress(h: IHeader, root: IHeader[]) {
        let ix: number[] = [];
        let seek = h;

        while (seek) {
            let p = this.getParent(seek);
            let list = p ? p.$children : root;
            let index = list.findIndex(c => c.$id === seek.$id);
            ix.push(index);
            seek = p;
        }

        ix.push(-1); // -1 means root

        return ix.reverse();
    }

    private _mapBranch(address: number[], list: IHeader[], map: (h: IHeader) => IHeader): IHeader[] {
        if (!list) {
            return list;
        }

        let len = address.length;

        let output = list.map((h) => {
            if (!len) {
                return map(h);
            }

            return {
                ...h,
                $children: this._mapBranch(address.slice(1), h.$children, map)
            };
        });

        return output;
    }

    private _recalcHeaders() {
        this._state.viewColumns = null;
        this._state.viewRows = null;
        this._state.types = {};
        this._state.indices = {};
        this._state.positions = {};
        this._state.levels = {};
        this._state.parents = {};
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
            let address = branch.split('/').filter(v => !!v).map(Number);
            let updateMap = branchMap[branch];

            // removing first -1 element, that represents root
            address.shift();

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

    public getManualResized(h: IHeader) {
        return (
            this._state.cache
                ? this._state.cache.getHeaderLock(h, this._state.types[h.$id])
                : this._state.headerManualResized.has(h.$id)
        );
    }

    public getManualResizedLevel(type: HeaderType, level: number) {
        return (
            this._state.cache
                ? this._state.cache.getLevelLock(level, type)
                : this._state.levelManualResized.has(`${type}:${level}`)
        );
    }

    /** Header level in logic tree. Used for positioning. */
    public getLevel(h: IHeader) {
        return this._state.levels[h.$id];
    }

    /** Header level in canvas. Used for measuring. */
    public getPositionLevel(h: IHeader) {
        const level = this.getLevel(h);
        const maxLevel = (this._state.types[h.$id] === HeaderType.Column ? this.topLevels : this.leftLevels) - 1;
        const hasChildren = h.$children && h.$children.length;
        return level < maxLevel && (h.$collapsed || !hasChildren) ? maxLevel : level;
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

    public getSize(h: IHeader) {
        if (!h) {
            return 0;
        }

        if (this._state.cache) {
            return this._state.cache.getHeaderSize(h, this._state.types[h.$id]);
        }

        return h.$collapsed ? h.$sizeCollapsed : h.$size;
    }

    public getLeftLevelWidth(level: number, isCollapsed?: boolean) {
        if (isCollapsed) {
            return this.offsetWidth - this.getLeftLevelPosition(level);
        }

        let v = (
            this._state.cache
                ? this._state.cache.getLevelSize(level, 'left')
                : this._state.leftLevels[level]
        );

        return v || this._state.headersWidth;
    }

    public getTopLevelHeight(level: number, isCollapsed?: boolean) {
        if (isCollapsed) {
            return this.offsetHeight - this.getTopLevelPosition(level);
        }

        let v = (
            this._state.cache
                ? this._state.cache.getLevelSize(level, 'top')
                : this._state.topLevels[level]
        );

        return v || this._state.headersHeight;
    }

    public getHeaderLeaves(h: IHeader) {
        return this._getLeaves(h);
    }

    /** top-down search */
    public getNodesTopDown(h: IHeader[]) {
        return this._getAllNodesByChildren(h);
    }

    /** bottom-up search */
    public getNodesBottomUp(h: IHeader[]) {
        return this._getAllNodesByParents(h);
    }

    public getSource() {
        return {
            cache: this._state.cache,
            columns: this._state.columns,
            rows: this._state.rows,
            columnWidth: this._state.columnWidth,
            rowHeight: this._state.rowHeight,
            headersHeight: this._state.headersHeight,
            headersWidth: this._state.headersWidth,
            filter: this._state.filter
        } as IHeaderRepositoryProps;
    }

    /** Create clone of repository with new applied filter. */
    public updateFilter(filter: HeaderFilter) {
        if (this._state.filter === filter) {
            return this;
        }

        let next = this._createClone();
        next._state.filter = filter;
        return next._recalcHeaders();
    }

    /** Update provided headers. Returns new perository. */
    public updateHeaders(updates: { header: IHeader, update: IHeader }[]) {
        let mapColumns: {
            [branchName: string]: {
                [$id: string]: IHeader;
            };
        } = {};

        let mapRows: typeof mapColumns = {};

        updates.forEach(({ header, update }) => {
            let headerType = this._state.types[header.$id];
            let address = this._getHeaderAddress(header, headerType === HeaderType.Row ? this._state.rows : this._state.columns);
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

        next = next._recalcHeaders();

        return next;
    }

    /**
     * Resize all headers.
     * @param list Array of headers.
     * @param clamp Size clamp function.
     * @param behavior Defines flag when header was resized by autosize or manually.
     * Header will not be autosized when it was manually resized. Default `"manual"`.
     */
    public resizeHeaders({ headers, clamp, behavior }: {
        headers: { header: IHeader, size: number }[];
        clamp?: HeaderClampFunction;
        behavior?: HeaderResizeBehavior;
    }) {
        if (!headers || !headers.length) {
            return this;
        }

        clamp = clamp || (({ size }) => size);
        behavior = behavior || 'manual';

        let updates: { header: IHeader, update: IHeader }[] = [];
        let leaves: IHeader[] = [];

        headers.forEach((u) => {
            let resizeList = this._getResizeList(u.header, u.size, clamp);

            resizeList.forEach(({ header, size }) => {
                leaves.push(header);

                updates.push({
                    header,
                    update: (
                        header.$collapsed
                            ? { $sizeCollapsed: size }
                            : { $size: size }
                    )
                });

                if (this._state.cache) {
                    this._state.cache.setHeaderSize(size, header, this._state.types[header.$id]);
                }
            });
        });

        let c = this.updateHeaders(updates);

        switch (behavior) {
            case 'manual':
            case 'reset':
                let isManual = behavior === 'manual';
                leaves.forEach((header) => {
                    if (isManual) {
                        c._state.headerManualResized.add(header.$id);

                        if (c._state.cache) {
                            c._state.cache.setHeaderLock(true, header, this._state.types[header.$id]);
                        }
                    } else {
                        c._state.headerManualResized.delete(header.$id);

                        if (c._state.cache) {
                            c._state.cache.setHeaderLock(false, header, this._state.types[header.$id]);
                        }
                    }
                });
        }

        return c;
    }

    /** Resize header levels, returns new repository. */
    public resizeLevels({ levels, behavior }: {
        levels: {
            type: HeaderType;
            level: number;
            size: number;
            min?: number;
            max?: number;
        }[],
        behavior?: HeaderResizeBehavior
    }) {
        behavior = behavior || 'manual';

        let next = this._createClone();

        for (let { level, type, size, max, min } of levels) {
            min = min == null ? 5 : min;
            max = max == null ? Infinity : max;

            let levelSize = Math.min(Math.max(min, size), max);

            if (type === HeaderType.Column) {
                if (next._state.cache) {
                    next._state.cache.setLevelSize(levelSize, level, 'top');
                }

                next._state.topLevels[level] = levelSize;
            } else {
                if (next._state.cache) {
                    next._state.cache.setLevelSize(levelSize, level, 'left');
                }

                next._state.leftLevels[level] = levelSize;
            }

            switch (behavior) {
                case 'manual':
                case 'reset':
                    let isManual = behavior === 'manual';
                    let key = `${type}:${level}`;
                    if (isManual) {
                        next._state.levelManualResized.add(key);

                        if (next._state.cache) {
                            next._state.cache.setLevelLock(true, level, type);
                        }
                    } else {
                        next._state.levelManualResized.delete(key);

                        if (next._state.cache) {
                            next._state.cache.setLevelLock(false, level, type);
                        }
                    }
            }
        }

        return next._recalcHeaders();
    }

    /** Update repository with new state properties. Returns new repository. */
    public update(props: IHeaderRepositoryProps) {
        let next = this._createClone();

        next._state = {
            ...next._state,
            ...props
        };

        return next._recalcHeaders();
    }
}

export default HeaderRepository;
