import { HeaderType } from '../types';

export class Header {
    private static _getIndices(list: Header[], out: number[] = []) {
        if (!list || !list.length) {
            return out;
        }

        list.forEach((h) => {
            if (h._index !== -1) {
                out.push(h._index);
                return;
            }

            Header._getIndices(h.children, out);
        });

        return out;
    }

    /** Header position. Assigned by Grid component. Do not change. */
    _position = 0;
    /** Header level. Assigned by Grid component. Do not change. */
    _level = 0;
    /** Header view index. Assigned by Grid component. Do not change. Use `index` getter.*/
    _index = -1;
    /** Header type. Assigned by Grid component. Do not change. */
    _type: HeaderType = null;

    constructor(
        /** Unique header id for all set. */
        public readonly id: number | string,
        /** Header size. If size is 0 - it will be overriden with columnWidth or rowHeight. Can be changed. */
        public size = 0,
        /** Header parent. Can be changed. */
        public parent: Header = null,
        /** Header children. Can be changed. */
        public children: Header[] = null
    ) {}

    /** View index. */
    get index() {
        return this._index;
    }

    get indices() {
        if (this._index !== -1) {
            return [this._index];
        }

        return Header._getIndices(this.children);
    }

    get type() {
        return this._type;
    }

    public getLeafs(out: Header[] = []) {
        if (!this.children || !this.children.length) {
            out.push(this);
            return out;
        }

        this.children.forEach(c => c.getLeafs(out));
        return out;
    }

    /** Used by Grid component. */
    _updateLevel() {
        let level = 0;
        let seek: Header = this;

        while (seek.parent) {
            level++;
            seek = seek.parent;
        }

        this._level = level;

        if (this.parent) {
            this.parent._updateLevel();
        }

        return level;
    }

    toJSON() {
        return {
            id: this.id,
            level: this._level,
            position: this._position,
            size: this.size,
            index: this._index
        };
    }

    public getLeafCount(): number {
        if (!this.children || !this.children.length) {
            return 1;
        }

        return this.children.reduce((p, c) => p + c.getLeafCount(), 0);
    }

    public updateSize(size: number, clamp?: (size: number) => number) {
        if (size <= 0) {
            size = 5;
        }

        if ((!this.children || !this.children.length) && clamp) {
            size = clamp(size);
        }

        let prevSize = this.size;
        this.size = size;

        if (!this.children || !this.children.length) {
            return;
        }

        let leafs = this.getLeafs();

        let d = 0;

        if (clamp) {
            leafs.forEach((c) => {
                let n = Math.floor(c.size * this.size / prevSize);
                let m = clamp(n - d);

                if (n < m) {
                    d += m - n;
                }
            });
        }

        leafs.forEach((c) => {
            c.updateSize(Math.floor(c.size * this.size / prevSize) - d, clamp);
        });
    }
}

