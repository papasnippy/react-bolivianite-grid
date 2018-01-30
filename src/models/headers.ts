import { Header } from './header';

export interface IHeadersProps {
    /** Column header height. */
    headersHeight: number;

    /** Row header width. */
    headersWidth: number;

    columns: number | Header[];
    rows: number | Header[];
    columnWidth: number;
    rowHeight: number;
}

export class Headers {
    public readonly headersHeight: number;
    public readonly headersWidth: number;
    public readonly columnWidth: number;
    public readonly rowHeight: number;

    public columns: Header[];
    public rows: Header[];

    constructor(props: IHeadersProps) {
        const { columns, rows, columnWidth, rowHeight, headersHeight, headersWidth } = props;

        this.headersHeight = headersHeight;
        this.headersWidth = headersWidth;
        this.columnWidth = columnWidth;
        this.rowHeight = rowHeight;

        if (typeof columns === 'number') {
            this.columns = new Array(columns).fill(null).map(() => new Header(columnWidth));
        } else {
            this.columns = columns;
        }

        if (typeof rows === 'number') {
            this.rows = new Array(rows).fill(null).map(() => new Header(rowHeight));
        } else {
            this.rows = rows;
        }

        this.calcPosition();
    }

    private _calcPosition(list: Header[], from: number, size: number) {
        let cursor = list[from].position;

        for (let i = from, len = list.length; i < len; i++) {
            if (!list[i].size) {
                list[i].size = size;
            }

            list[i].position = cursor;
            cursor += list[i].size;
        }
    }

    public calcPosition(from = 0) {
        this._calcPosition(this.columns, from, this.columnWidth);
        this._calcPosition(this.rows, from, this.rowHeight);
    }
}
