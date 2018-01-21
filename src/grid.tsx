import * as React from 'react';
import ScrollView, { IScrollViewUpdateEvent } from './scrollview';
import RenderThrottler from './renderthrottler';
import debounce from './debounce';
import Shallow from './shallow';

import {
    IGridAddress, IGridSelection, IGridView, IGridOverscan
} from './types';

const Style = require('./grid.scss');

//#region interfaces
export interface ICellRendererEvent {
    rowIndex: number;
    columnIndex: number;
    active: boolean;
    style: React.CSSProperties;
}

export interface IHeaderRendererEvent {
    type: 'rows' | 'columns';
    index: number;
    selection: boolean;
    style: React.CSSProperties;
    header: any;
}

export interface ISelectionRendererEvent {
    key: number;
    style: React.CSSProperties;
    active: boolean;
}

export interface IGridClasses {
    rows?: string;
    columns?: string;
    corner?: string;
    main?: string;
    // todo: scrollbars
}

export interface IGridStyles {
    rows?: React.CSSProperties;
    columns?: React.CSSProperties;
    corner?: React.CSSProperties;
    main?: React.CSSProperties;
    // todo: scrollbars
}

export interface IGridProps {
    tabIndex?: number;
    columns: number | any[];
    rows: number | any[];
    defaultWidth: number;
    defaultHeight: number;
    overscanRows?: number;
    overscanColumns?: number;
    headersHeight?: number;
    headersWidth?: number;
    classes?: IGridClasses;
    styles?: IGridStyles;

    onRenderCell: (e: ICellRendererEvent) => JSX.Element;
    onRenderHeader: (e: IHeaderRendererEvent) => JSX.Element;
    onRenderSelection: (e: ISelectionRendererEvent) => JSX.Element;
}
//#endregion

export class Grid extends React.Component<IGridProps, any> {
    private _shallow = {
        colHeaders: Shallow<React.CSSProperties>(),
        rowHeaders: Shallow<React.CSSProperties>(),
        crnHeaders: Shallow<React.CSSProperties>()
    };

    private _headerSize: { cols: number[]; rows: number[]; } = { cols: [], rows: [] };
    private _headerPos: { cols: number[]; rows: number[]; } = { cols: [], rows: [] };
    private _scrollSize = 15;
    private _rt = new RenderThrottler();
    private _scrollUpdateTrottled = this._rt.create();
    private _ref: HTMLDivElement = null;
    private _refScroller: HTMLDivElement = null;
    private _scrollerProps: React.HTMLProps<HTMLDivElement> = { style: { willChange: 'transform' } };
    private _lastView: IGridView = null;
    private _lastOverscan: IGridOverscan = null;
    private _focused = false;

    state = {
        scrollLeft: 0,
        scrollTop: 0,
        viewHeight: 0,
        viewWidth: 0,
        active: {
            row: 0,
            column: 0
        } as IGridAddress,
        edit: null as IGridAddress,
        selection: [{
            row: 0,
            column: 0,
            width: 0,
            height: 0
        }] as IGridSelection[]
    };

    constructor(p: IGridProps, c: any) {
        super(p, c);

        this._onAfterUpdate = debounce(500, this._onAfterUpdate.bind(this));
    }

    private get _columnCount() {
        return typeof this.props.columns === 'number' ? this.props.columns : this.props.columns.length;
    }

    private get _rowCount() {
        return typeof this.props.rows === 'number' ? this.props.rows : this.props.rows.length;
    }

    private _onRef = (r: HTMLDivElement) => {
        this._ref = r;
    }

    private _onRefScroller = (r: HTMLDivElement) => {
        this._refScroller = r;
    }

    private _onBlur = () => {
        this._focused = false;
        console.log(`this._focused = ${this._focused}`);
    }

    private _onFocus = () => {
        this._focused = true;
        console.log(`this._focused = ${this._focused}`);
    }

    private _onScrollViewUpdate = (e: IScrollViewUpdateEvent) => {
        this._scrollUpdateTrottled(() => {
            if (this.state.viewWidth !== e.clientWidth || this.state.viewHeight !== e.clientHeight) {
                this.setState({ viewWidth: e.clientWidth, viewHeight: e.clientHeight });
            }

            if (this.state.scrollLeft !== e.scrollLeft) {
                this.setState({ scrollLeft: e.scrollLeft });
            }

            if (this.state.scrollTop !== e.scrollTop) {
                this.setState({ scrollTop: e.scrollTop });
            }
        });
    }

    private _onAfterUpdate() {
        this._refScroller = this._refScroller;
    }

    private _createView() {
        const sl = this.state.scrollLeft;
        const st = this.state.scrollTop;
        const vw = this.state.viewWidth;
        const vh = this.state.viewHeight;

        let rows = 0;
        let firstRow = -1;
        let lastRow = -1;
        let rowIndex = 0;

        for (let rowSize of this._headerSize.rows) {
            this._headerPos.rows[rowIndex] = rows;

            if (firstRow === -1 && rows >= st - rowSize) {
                firstRow = rowIndex;
            }

            rows += rowSize;

            if (lastRow === -1 && rows >= st + vh + this._scrollSize) {
                lastRow = rowIndex;
            }

            rowIndex++;
        }

        if (lastRow === -1 && firstRow !== -1) {
            lastRow = rowIndex;
        }

        let columns = 0;
        let firstColumn = -1;
        let lastColumn = -1;
        let colIndex = 0;

        for (let colSize of this._headerSize.cols) {
            this._headerPos.cols[colIndex] = columns;

            if (firstColumn === -1 && columns >= sl - colSize) {
                firstColumn = colIndex;
            }

            columns += colSize;

            if (lastColumn === -1 && columns >= sl + vw + this._scrollSize) {
                lastColumn = colIndex;
            }

            colIndex++;
        }

        if (lastColumn === -1 && firstColumn !== -1) {
            lastColumn = colIndex;
        }

        this._lastView = { firstRow, lastRow, firstColumn, lastColumn, rows, columns };
    }

    private _createOverscan() {
        if (!this._lastView) {
            return;
        }

        let { firstColumn, firstRow, lastColumn, lastRow } = this._lastView;

        if (this.props.overscanRows) {
            firstRow = Math.max(0, firstRow - this.props.overscanRows);
            lastRow = Math.min(Math.max(0, this._rowCount - 1), lastRow + this.props.overscanRows);
        } else {
            firstRow = Math.max(0, firstRow);
        }

        if (this.props.overscanColumns) {
            firstColumn = Math.max(0, firstColumn - this.props.overscanColumns);
            lastColumn = Math.min(Math.max(0, this._columnCount - 1), lastColumn + this.props.overscanColumns);
        } else {
            firstColumn = Math.max(0, firstColumn);
        }

        this._lastOverscan = {
            firstRow, lastRow, firstColumn, lastColumn
        };
    }

    private _renderCell(row: number, col: number) {
        let cell = this.props.onRenderCell({
            rowIndex: row,
            columnIndex: col,
            active: row === this.state.active.row && col === this.state.active.column,
            style: {
                top: this._headerPos.rows[row],
                left: this._headerPos.cols[col],
                height: this._headerSize.rows[row],
                width: this._headerSize.cols[col],
                position: 'absolute',
                zIndex: 1
            }
        });

        return React.cloneElement(React.Children.only(cell), {
            'x-row': row,
            'x-col': col,
            key: `${row}x${col}`
        });
    }

    private _renderData() {
        if (!this._lastOverscan) {
            return;
        }

        const { firstColumn, firstRow, lastColumn, lastRow } = this._lastOverscan;
        const columnCount = this._columnCount;
        const rowCount = this._rowCount;

        if (!columnCount || !rowCount) {
            return null;
        }

        let irlen = Math.max(0, Math.min(rowCount - firstRow, 1 + lastRow - firstRow));
        let iclen = Math.max(0, Math.min(columnCount - firstColumn, 1 + lastColumn - firstColumn));
        let jsx: JSX.Element[] = new Array(irlen * iclen);
        let i = 0;

        for (let ir = 0; ir < irlen; ir++) {
            for (let ic = 0; ic < iclen; ic++) {
                let r = ir + firstRow;
                let c = ic + firstColumn;
                jsx[i++] = this._renderCell(r, c);
            }
        }

        if (this.state.edit && (
                (this.state.edit.column < firstColumn) || (this.state.edit.column > lastRow) ||
                (this.state.edit.row < firstRow) || (this.state.edit.row > lastRow)
            )
        ) {
            jsx.push(this._renderCell(this.state.edit.row, this.state.edit.column));
        }

        return jsx;
    }

    private _renderHeader(type: 'rows' | 'columns', index: number, header: any, scrollPos: number) {
        let style: React.CSSProperties = {
            position: 'absolute',
            zIndex: 1
        };

        if (type === 'rows') {
            style.left = 0;
            style.top = (this._headerPos.rows[index] || 0) - scrollPos;
            style.height = (this._headerSize.rows[index] || 0);
            style.width = this.props.headersWidth;
        } else {
            style.left = (this._headerPos.cols[index] || 0) - scrollPos;
            style.top = 0;
            style.height = this.props.headersHeight;
            style.width = (this._headerSize.cols[index] || 0);
        }

        let selection = false;

        for (let s of this.state.selection) {
            if (type === 'rows') {
                if (index >= s.row && index <= (s.row + s.height)) {
                    selection = true;
                    break;
                }
            } else {
                if (index >= s.column && index <= (s.column + s.width)) {
                    selection = true;
                    break;
                }
            }
        }

        let cell = this.props.onRenderHeader({ type, index, header, style, selection });

        return React.cloneElement(React.Children.only(cell), {
            'x-type': type,
            'x-index': index,
            key: `${type}:${index}`
        });
    }

    private _renderHeaders(type: 'rows' | 'columns', scrollPos: number) {
        if (!this._lastOverscan) {
            return;
        }

        const { firstColumn, firstRow, lastColumn, lastRow } = this._lastOverscan;
        const first = type === 'rows' ? firstRow : firstColumn;
        const last = type === 'rows' ? lastRow : lastColumn;
        const max = type === 'rows' ? this._rowCount : this._columnCount;
        const headers = type === 'rows' ? this.props.rows : this.props.columns;
        const isHNum = typeof headers === 'number';

        let len = Math.max(0, Math.min(max - first, 1 + last - first));
        let jsx: JSX.Element[] = [];

        for (let i = 0; i < len; i++) {
            let ix = i + first;
            let h = isHNum ? null : (headers as any[])[ix];
            jsx.push(this._renderHeader(type, ix, h, scrollPos));
        }

        return (
            <>
                {jsx}
            </>
        );
    }

    private _renderHeaderContainers = ({ clientWidth, clientHeight, scrollLeft, scrollTop }: IScrollViewUpdateEvent) => {
        const cnColumns = [
            Style.headerMount,
            Style.headerColumns,
            (this.props.classes && this.props.classes.columns || null)
        ].filter(v => !!(v || '').trim()).join(' ');

        const cnRows = [
            Style.headerMount,
            Style.headerRows,
            (this.props.classes && this.props.classes.rows || null)
        ].filter(v => !!(v || '').trim()).join(' ');

        const cnCorner = [
            Style.headerMount,
            Style.headerCorner,
            (this.props.classes && this.props.classes.corner || null)
        ].filter(v => !!(v || '').trim()).join(' ');

        return (
            <div
                className={Style.headersRoot}
                style={{
                    width: clientWidth + this._scrollSize,
                    height: clientHeight + this._scrollSize
                }}
            >
                {!!this.props.headersHeight &&
                    <div
                        className={cnColumns}
                        style={this._shallow.colHeaders({
                            ...(this.props.styles && this.props.styles.columns || {}),
                            left: this.props.headersWidth,
                            top: 0,
                            right: 0,
                            height: this.props.headersHeight
                        })}
                    >
                        {this._renderHeaders('columns', scrollLeft)}
                    </div>
                }
                {!!this.props.headersWidth &&
                    <div
                        className={cnRows}
                        style={this._shallow.rowHeaders({
                            ...(this.props.styles && this.props.styles.rows || {}),
                            left: 0,
                            top: this.props.headersHeight,
                            bottom: 0,
                            width: this.props.headersWidth
                        })}
                    >
                        {this._renderHeaders('rows', scrollTop)}
                    </div>
                }
                {!!(this.props.headersHeight || this.props.headersWidth) &&
                    <div
                        className={cnCorner}
                        style={this._shallow.crnHeaders({
                            ...(this.props.styles && this.props.styles.corner || {}),
                            left: 0,
                            top: 0,
                            height: this.props.headersHeight,
                            width: this.props.headersWidth
                        })}
                    >
                    </div>
                }
            </div>
        );
    }

    private _renderSelections(): JSX.Element[] {
        if (!this._headerPos.cols.length || !this._headerPos.rows.length) {
            return null;
        }

        let jsx = this.state.selection.map(({ row, column, width, height }, i) => {
            let l = this._headerPos.cols[column];
            let t = this._headerPos.rows[row];
            let w = this._headerSize.cols.slice(column, column + width + 1).reduce((r, n) => r + n, 0);
            let h = this._headerSize.rows.slice(row, row + height + 1).reduce((r, n) => r + n, 0);

            return this.props.onRenderSelection({
                key: i,
                active: false,
                style: {
                    position: 'absolute',
                    zIndex: i,
                    left: l,
                    top: t,
                    width: w,
                    height: h
                }
            });
        });

        let ax = jsx.length;

        jsx.push(this.props.onRenderSelection({
            key: ax,
            active: true,
            style: {
                position: 'absolute',
                zIndex: ax,
                left: this._headerPos.cols[this.state.active.column],
                top: this._headerPos.rows[this.state.active.row],
                width: this._headerSize.cols[this.state.active.column],
                height: this._headerSize.rows[this.state.active.row]
            }
        }));

        return jsx;
    }

    public focus() {
        if (this._ref) {
            this._ref.focus();
        }
    }

    public blur() {
        if (this._ref) {
            this._ref.blur();
        }
    }

    public componentDidMount() {
        this._headerSize.rows = new Array(this._rowCount).fill(this.props.defaultHeight);
        this._headerSize.cols = new Array(this._columnCount).fill(this.props.defaultWidth);
        this._headerPos.rows = this._headerSize.rows.slice();
        this._headerPos.cols = this._headerSize.cols.slice();

        this.forceUpdate();
    }

    public componentDidUpdate() {
        this._onAfterUpdate();
    }

    public render() {
        const className = [
            Style.root,
            (this.props.classes && this.props.classes.main || null)
        ].filter(v => !!(v || '').trim()).join(' ');

        this._createView();
        this._createOverscan();

        const { rows, columns } = this._lastView;

        return (
            <div
                className={className}
                tabIndex={this.props.tabIndex == null ? -1 : this.props.tabIndex}
                ref={this._onRef}
                onBlur={this._onBlur}
                onFocus={this._onFocus}
                style={this.props.styles && this.props.styles.main || null}
            >
                <ScrollView
                    size={this._scrollSize}
                    onUpdate={this._onScrollViewUpdate}
                    backgroundColor='rgba(0, 0, 0, 0.3)'
                    scrollerProps={this._scrollerProps}
                    afterContent={this._renderHeaderContainers}
                >
                    <div
                        ref={this._onRefScroller}
                        style={{
                            height: rows,
                            width: columns,
                            boxSizing: 'border-box',
                            position: 'relative',
                            marginLeft: this.props.headersWidth || 0,
                            marginTop: this.props.headersHeight || 0
                        }}
                    >
                        {this._renderData()}
                    </div>
                    <div
                        style={{
                            position: 'absolute',
                            pointerEvents: 'none',
                            zIndex: 1,
                            left: this.props.headersWidth || 0,
                            top: this.props.headersHeight || 0
                        }}
                    >
                        {this._renderSelections()}
                    </div>
                </ScrollView>
            </div>
        );
    }
}
