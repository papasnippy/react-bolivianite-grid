import * as React from 'react';
import FallbackScrollView, { IScrollViewUpdateEvent } from './scroll-view';
import KeyboardController, { IKeyboardControllerRemoveEvent, IKeyboardControllerPasteEvent } from './keyboard-controller';
import MouseController from './mouse-controller';
import RenderThrottler from './render-throttler';
import debounce from './debounce';
import { IUpdateSelectionEvent } from './base-controller';

import {
    IGridProps, IGridResizeCombinedEvent, IMeasureResult, ICellRenderBaseEvent, ICellRendererEvent,
    IGridAddress, IGridSelection, IGridView, IGridOverscan, IHeader, HeaderType, HeaderResizeBehavior
} from './types';

import Context from './context';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'react-bolivianite-grid': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
        }
    }
}

export class Grid extends React.PureComponent<IGridProps, any> {
    //#region properties
    private _detached = false;
    private _blockContextMenu = false;
    private _onContextMenuListener: any = null;
    private _rt = new RenderThrottler();
    private _scrollUpdateTrottled = this._rt.create();
    private _ref: HTMLDivElement = null;
    private _refView: FallbackScrollView = null;
    private _scrollerStyle: React.CSSProperties = { willChange: 'transform', zIndex: 0 };
    private _lastView: IGridView = null;
    private _lastOverscan: IGridOverscan = null;
    private _focused = false;
    private _kbCtr: KeyboardController = null;
    private _msCtr: MouseController = null;
    private _currentEdit: {
        row: number;
        col: number;
        nextValue: any;
        updatedValue: boolean;
    } = null;

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
        }] as IGridSelection[],
        resizeHeaderPreview: null as {
            header: IHeader;
            change: number;
        },
        resizeLevelPreview: null as {
            header: IHeader;
            change: number;
        }
    };

    // https://bugs.chromium.org/p/chromium/issues/detail?id=769390
    private _chromeFix = {
        row: -1,
        column: -1
    };
    //#endregion

    constructor(p: IGridProps, c: any) {
        super(p, c);

        this._onAfterUpdate = debounce(500, this._onAfterUpdate.bind(this));

        this._kbCtr = new KeyboardController({
            getState: this._ctrlGetState,
            onCloseEditor: this.closeEditor,
            onOpenEditor: this.openEditor,
            onScroll: this.scrollTo,
            onUpdateSelection: this.updateSelection,
            onCopy: this._ctrlCopy,
            onPaste: this._ctrlPaste,
            onNullify: this._ctrlNullify,
            onRemove: this._ctrlRemove,
            onSpace: this._ctrlSpace
        });

        this._msCtr = new MouseController({
            getState: this._ctrlGetState,
            onCloseEditor: this.closeEditor,
            onOpenEditor: this.openEditor,
            onScroll: this.scrollTo,
            onUpdateSelection: this.updateSelection,
            onRightClick: this._ctrlRightClick
        });
    }

    //#region getters
    private get _theme() {
        return this.props.theme || {};
    }

    private get _columnCount() {
        return this.props.repository ? this.props.repository.columns.length : 0;
    }

    private get _rowCount() {
        return this.props.repository ? this.props.repository.rows.length : 0;
    }

    private get _headersHeight() {
        return this.props.repository.offsetHeight || 0;
    }

    private get _headersWidth() {
        return this.props.repository.offsetWidth || 0;
    }

    private get _selection() {
        return this.props.selection || this.state.selection;
    }

    private get _active() {
        return this.props.active || this.state.active;
    }
    //#endregion

    //#region root handlers
    private _onRef = (r: HTMLDivElement) => {
        this._ref = r;
    }

    private _onRefView = (r: FallbackScrollView) => {
        this._refView = r;
    }

    private _onBlur = () => {
        this._focused = false;
    }

    private _onFocus = () => {
        this._focused = true;
    }

    private _onRootMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        e.persist();
        let x = e.clientX;
        let y = e.clientY;
        let rect = this._ref.getBoundingClientRect();
        this._msCtr.rootleave(x, y, rect);
    }

    private _onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        e.persist();
        this._kbCtr.keydown(e);
    }

    private _onRootMouseEnter = () => {
        this._msCtr.rootenter();
    }

    private _onRootMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        this.focus();

        if (e.button === 2) {
            this._blockContextMenu = true;
        }
    }

    private _onScrollViewUpdate = (e: IScrollViewUpdateEvent) => {
        this._scrollUpdateTrottled(() => {
            if (this.state.viewWidth !== e.clientWidth
                || this.state.viewHeight !== e.clientHeight
                || this.state.scrollLeft !== e.scrollLeft
                || this.state.scrollTop !== e.scrollTop
            ) {
                this.setState({
                    viewWidth: e.clientWidth,
                    viewHeight: e.clientHeight,
                    scrollLeft: e.scrollLeft,
                    scrollTop: e.scrollTop
                });
            }
        });
    }
    //#endregion

    //#region controller handlers
    private _ctrlGetState = () => {
        return {
            active: this.state.active,
            editor: this.state.edit,
            selection: this._selection,
            focused: this._focused,
            columns: this._columnCount,
            rows: this._rowCount,
            view: this._lastView,
            readOnly: this.props.readOnly
        };
    }

    private _ctrlGetActiveNotifier(prev: IGridAddress, next: IGridAddress) {
        if (!this.props.onActiveChanged || prev == next || (prev && next && prev.column === next.column && prev.row === next.row)) {
            return null;
        }

        prev = prev ? { ...prev } : null;
        next = next ? { ...next } : null;
        return () => this.props.onActiveChanged({ previous: prev, active: next });
    }

    private _ctrlGetSelectionNotifier(prev: IGridSelection[], next: IGridSelection[]) {
        if (!this.props.onSelectionChanged || prev == next) {
            return null;
        }

        if (prev && next && prev.length === next.length && prev.every((a, i) => {
            return (
                a.column === next[i].column
                && a.height === next[i].height
                && a.row === next[i].row
                && a.width === next[i].width
            );
        })) {
            return null;
        }

        prev = prev ? prev.slice().map(a => ({ ...a })) : null;
        next = next ? next.slice().map(a => ({ ...a })) : null;
        return () => this.props.onSelectionChanged({ previous: prev, active: next });
    }

    private _ctrlRightClick = (cell: IGridAddress, event: React.MouseEvent<HTMLElement>) => {
        if (this.props.onRightClick) {
            this.props.onRightClick({ cell, event });
        }
    }

    private _ctrlCopy = (cells: IGridAddress[], withHeaders: boolean) => {
        if (this.props.onCopy) {
            this.props.onCopy({
                withHeaders, cells,
                repository: this.props.repository,
                data: this.props.data,
                focus: () => { this.focus(); }
            });
        }
    }

    private _ctrlPaste = ({ clipboard, getAllSelectedCells, getLastSelectedCells }: IKeyboardControllerPasteEvent) => {
        if (this.props.onPaste) {
            this.props.onPaste({
                clipboard,
                getAllSelectedCells,
                getLastSelectedCells,
                repository: this.props.repository,
                data: this.props.data,
                target: {
                    ...this._active
                }
            });
        }
    }
    private _ctrlNullify = (cells: IGridAddress[]) => {
        if (this.props.onNullify) {
            this.props.onNullify({ cells });
        }
    }

    private _ctrlRemove = (event: IKeyboardControllerRemoveEvent) => {
        if (this.props.onRemove) {
            this.props.onRemove(event);
        }
    }

    private _ctrlSpace = (cells: IGridAddress[]) => {
        if (this.props.onSpace) {
            this.props.onSpace({ cells });
        }
    }
    //#endregion

    //#region elements handlers
    private _onCellMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        e.persist();
        let row = Number(e.currentTarget.getAttribute('x-row'));
        let column = Number(e.currentTarget.getAttribute('x-col'));

        if (e.button === 1) {
            this._chromeFix = { row, column };
        }

        this.focus();

        this._msCtr.mousedown(e, row, column);
    }

    private _onCellTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        let row = Number(e.currentTarget.getAttribute('x-row'));
        let column = Number(e.currentTarget.getAttribute('x-col'));

        this._chromeFix = { row, column };

        this.focus();
    }

    private _onHeaderMouseDownHeader = (e: React.MouseEvent<HTMLElement>) => {
        e.persist();
        let type: HeaderType = Number(e.currentTarget.getAttribute('x-type'));
        let id = e.currentTarget.getAttribute('x-id');
        let h = this.props.repository.getHeader(id);
        this.focus();

        if (!h) {
            return;
        }

        if (this.props.onHeaderRightClick) {
            this.props.onHeaderRightClick({ header: h, event: e });

            if (e.defaultPrevented) {
                return;
            }
        }

        let leaves = this.props.repository.getHeaderLeaves(h);
        let indices = leaves.map(v => this.props.repository.getViewIndex(v));

        if (!indices.length) {
            return;
        }

        let min = Math.min(...indices);
        let max = Math.max(...indices);

        this._msCtr.headerdown(e, type, min, max);
    }

    private _onCornerMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        if (this.state.edit || e.button !== 0) {
            return;
        }

        const select = () => {
            this.setState({
                selection: [{
                    row: 0,
                    column: 0,
                    width: this._columnCount - 1,
                    height: this._rowCount - 1
                }]
            });
        };

        if (this.state.edit) {
            this.closeEditor(true, select);
            return;
        }

        select();
    }

    private _onCellMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
        let row = Number(e.currentTarget.getAttribute('x-row'));
        let column = Number(e.currentTarget.getAttribute('x-col'));
        this._msCtr.mouseenter(row, column);
    }
    //#endregion

    private _onAutoMeasureApply(
        { cells, headers }: IMeasureResult,
        behavior: HeaderResizeBehavior,
        workType: 'levels' | 'cells' | 'all',
        headerType: HeaderType | 'all',
    ) {
        cells = (cells || []).filter(v => !!v);
        headers = (headers || []).filter(v => !!v);

        const ctr = this.props.repository;
        const isReset = behavior === 'reset';

        const combinedEvent: IGridResizeCombinedEvent = {
            behavior
        };

        if ((workType === 'all' || workType === 'cells')) {
            const columnHeaders = ctr.columns;
            const rowHeaders = ctr.rows;

            let columns: { [colIndex: string]: number } = {};
            let rows: { [rowIndex: string]: number } = {};
            let headerColSizes: typeof columns = {};
            let headerRowSizes: typeof columns = {};

            headers.forEach(({ height, width, header }) => {
                let vi = ctr.getViewIndex(header);

                if (ctr.getHeaderType(header) === HeaderType.Row) {
                    headerRowSizes[vi] = Math.max(headerRowSizes[vi] || 0, height);
                } else {
                    headerColSizes[vi] = Math.max(headerColSizes[vi] || 0, width);
                }
            });

            if (!cells.length) {
                let { firstColumn, firstRow, lastRow, lastColumn } = this._lastView;

                if (firstRow !== -1 || firstColumn !== -1) {
                    if (firstRow === -1) {
                        firstRow = 0;
                        lastRow = 0;
                    } else {
                        firstColumn = 0;
                        lastColumn = 0;
                    }

                    for (let r = firstRow; r <= lastRow; r++) {
                        for (let c = firstColumn; c <= lastColumn; c++) {
                            cells.push({
                                column: c,
                                row: r,
                                height: 0,
                                width: 0
                            });
                        }
                    }
                }
            }

            for (let { row, column, height, width } of cells) {
                columns[column] = Math.max(headerColSizes[column] || 0, columns[column] == null ? width : Math.max(width, columns[column]));
                rows[row] = Math.max(headerRowSizes[row] || 0, rows[row] == null ? height : Math.max(height, rows[row]));
            }

            let ch = (headerType === 'all' || headerType === HeaderType.Column)
                ? Object
                    .keys(columns)
                    .map(k => ({ columnIndex: Number(k), width: Math.round(columns[k]) }))
                    .filter(({ width, columnIndex }) => {
                        let h = columnHeaders[columnIndex];
                        let size = this.props.repository.getSize(h);
                        return h && (isReset || !ctr.getManualResized(h) && Math.round(size) < width);
                    })
                    .map(({ columnIndex, width }) => ({
                        header: columnHeaders[columnIndex],
                        size: width,
                        type: ctr.getHeaderType(columnHeaders[columnIndex])
                    }))
                : [];

            let rh = (headerType === 'all' || headerType === HeaderType.Row)
                ? Object
                    .keys(rows)
                    .map(k => ({ rowIndex: Number(k), height: Math.round(rows[k]) }))
                    .filter(({ rowIndex, height }) => {
                        let h = rowHeaders[rowIndex];
                        let size = this.props.repository.getSize(h);
                        return h && (isReset || !ctr.getManualResized(h) && Math.round(size) < height);
                    })
                    .map(({ rowIndex, height }) => ({
                        header: rowHeaders[rowIndex],
                        size: height,
                        type: ctr.getHeaderType(rowHeaders[rowIndex])
                    }))
                : [];

            if (ch.length || rh.length) {
                combinedEvent.headers = [...ch, ...rh];
            }
        }

        if ((workType === 'all' || workType === 'levels') && headers.length) {
            const topLevels: { [level: number]: number } = {};
            const leftLevels: typeof topLevels = {};

            for (let { header: h, height, width } of headers) {
                const type = ctr.getHeaderType(h);
                const level = ctr.getLevel(h);

                if (ctr.getManualResizedLevel(type, level) && !isReset) {
                    return;
                }

                if (type === HeaderType.Column) {
                    topLevels[level] = (height > (topLevels[level] || 0)) ? height : topLevels[level];
                } else {
                    leftLevels[level] = (width > (leftLevels[level] || 0)) ? width : leftLevels[level];
                }
            }

            const top = (headerType === 'all' || headerType === HeaderType.Column)
                ? Object
                    .keys(topLevels)
                    .map((k) => {
                        const level = Number(k);
                        const size = topLevels[level];

                        if (size == null || !isReset && Math.round(size) <= Math.round(ctr.getTopLevelHeight(level))) {
                            return null;
                        }

                        return {
                            level, size,
                            type: HeaderType.Column
                        };
                    })
                    .filter(v => !!v)
                : [];

            const left = (headerType === 'all' || headerType === HeaderType.Row)
                ? Object
                    .keys(leftLevels)
                    .map((k) => {
                        const level = Number(k);
                        const size = leftLevels[level];

                        if (size == null || !isReset && Math.round(size) <= Math.round(ctr.getLeftLevelWidth(level))) {
                            return null;
                        }

                        return {
                            level, size,
                            type: HeaderType.Row
                        };
                    })
                    .filter(v => !!v)
                : [];


            if (top.length || left.length) {
                combinedEvent.levels = [...top, ...left];
            }
        }

        if (combinedEvent.headers || combinedEvent.levels) {
            this.props.onHeaderResize(combinedEvent);
        }
    }

    private _onAutoMeasure() {
        if (this.state.edit || !this.props.onAutoMeasure || !this.props.onHeaderResize || !this._lastView) {
            return;
        }

        const { firstColumn, firstRow, lastRow, lastColumn } = this._lastView;

        const ctr = this.props.repository;
        const { columns, rows } = ctr;
        const cells: ICellRenderBaseEvent[] = [];

        for (let r = firstRow; r <= lastRow; r++) {
            for (let c = firstColumn; c <= lastColumn; c++) {
                if (columns[c] && rows[r]) {
                    cells.push({
                        column: c,
                        row: r,
                        columnHeader: columns[c],
                        rowHeader: rows[r]
                    });
                }
            }
        }

        const columnHeaders = ctr.getNodesBottomUp(columns.slice(firstColumn, lastColumn + 1));
        const rowHeaders = ctr.getNodesBottomUp(rows.slice(firstRow, lastRow + 1));

        const headers = [...columnHeaders, ...rowHeaders].map((h) => {
            return {
                index: ctr.getViewIndex(h),
                type: ctr.getHeaderType(h),
                level: ctr.getLevel(h),
                header: h
            };
        });

        if (!cells.length && !headers.length) {
            return;
        }

        this.props.onAutoMeasure({
            cells,
            headers,
            data: this.props.data,
            callback: (result: IMeasureResult) => {
                this._onAutoMeasureApply(result, 'auto', 'all', 'all');
            }
        });
    }

    private _onAfterUpdate() {
        this._onAutoMeasure();

        if (this._refView) {
            let style = this._refView.scrollerStyle as any;
            style.willChange = '';

            setTimeout(() => {
                if (this._detached) {
                    return;
                }

                style.willChange = 'transform';
            }, 500);
        }
    }

    private _createView() {
        const sl = this.state.scrollLeft;
        const st = this.state.scrollTop;
        const vw = this.state.viewWidth - this._headersWidth;
        const vh = this.state.viewHeight - this._headersHeight;

        let rowsHeight = 0;
        let firstRow = -1;
        let lastRow = -1;
        let rowIndex = 0;

        for (let rh of this.props.repository.rows) {
            let hsize = this.props.repository.getSize(rh);

            if (firstRow === -1 && rowsHeight >= st - hsize) {
                firstRow = rowIndex;
            }

            rowsHeight += hsize;

            if (lastRow === -1 && rowsHeight >= st + vh) {
                lastRow = rowIndex;
                break;
            }

            rowIndex++;
        }

        if (lastRow === -1 && firstRow !== -1) {
            lastRow = rowIndex;
        }

        let columnsWidth = 0;
        let firstColumn = -1;
        let lastColumn = -1;
        let colIndex = 0;

        for (let ch of this.props.repository.columns) {
            let csize = this.props.repository.getSize(ch);
            if (firstColumn === -1 && columnsWidth >= sl - csize) {
                firstColumn = colIndex;
            }

            columnsWidth += csize;

            if (lastColumn === -1 && columnsWidth >= sl + vw) {
                lastColumn = colIndex;
                break;
            }

            colIndex++;
        }

        if (lastColumn === -1 && firstColumn !== -1) {
            lastColumn = colIndex;
        }

        let rhLast = this.props.repository.rows[this.props.repository.rows.length - 1];
        let chLast = this.props.repository.columns[this.props.repository.columns.length - 1];

        if (rhLast) {
            rowsHeight = this.props.repository.getPosition(rhLast) + this.props.repository.getSize(rhLast);
        }

        if (chLast) {
            columnsWidth = this.props.repository.getPosition(chLast) + this.props.repository.getSize(chLast);
        }

        this._lastView = { firstRow, lastRow, firstColumn, lastColumn, rowsHeight, columnsWidth };
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

    private _prepareCellProps(row: number, col: number) {
        let rh = this.props.repository.rows[row];
        let ch = this.props.repository.columns[col];

        if (!rh || !ch) {
            return null;
        }

        return {
            row: row,
            column: col,
            rowHeader: rh,
            columnHeader: ch,
            active: row === this._active.row && col === this._active.column,
            data: this.props.data,
            theme: this.props.theme,
            style: {
                top: this.props.repository.getPosition(rh),
                left: this.props.repository.getPosition(ch),
                height: this.props.repository.getSize(rh),
                width: this.props.repository.getSize(ch),
                position: 'absolute',
                zIndex: 1
            }
        } as ICellRendererEvent;
    }

    private _renderCell(row: number, col: number) {
        const props = this._prepareCellProps(row, col);

        if (!props) {
            return null;
        }

        const cell = this.props.onRenderCell(props);

        return React.cloneElement(React.Children.only(cell), {
            'x-row': row,
            'x-col': col,
            key: `C${row}x${col}`,
            onMouseDown: this._onCellMouseDown,
            onMouseEnter: this._onCellMouseEnter,
            onTouchStart: this._onCellTouchStart
        });
    }

    private _renderEditor(row: number, col: number) {
        if (!this.props.onRenderEditor) {
            return this._renderCell(row, col);
        }

        if (!this._currentEdit || (this._currentEdit.row !== row || this._currentEdit.col !== col)) {
            this._currentEdit = {
                row, col,
                nextValue: null,
                updatedValue: false
            };
        }

        const props = this._prepareCellProps(row, col);

        if (!props) {
            return null;
        }

        const cell = this.props.onRenderEditor({
            ...props,
            close: (commit: boolean) => {
                this.closeEditor(commit);
            },
            update: (nextValue: any) => {
                this._currentEdit.nextValue = nextValue;
                this._currentEdit.updatedValue = true;
            }
        });

        return React.cloneElement(React.Children.only(cell), {
            'x-row': row,
            'x-col': col,
            key: `E${row}x${col}`
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
        let { edit } = this.state;

        for (let ir = 0; ir < irlen; ir++) {
            for (let ic = 0; ic < iclen; ic++) {
                let r = ir + firstRow;
                let c = ic + firstColumn;

                if (edit && edit.column === c && edit.row === r) {
                    jsx[i++] = this._renderEditor(r, c);
                } else {
                    jsx[i++] = this._renderCell(r, c);
                }
            }
        }

        if (edit && (
            (edit.column < firstColumn) || (edit.column > lastColumn) ||
            (edit.row < firstRow) || (edit.row > lastRow)
        )) {
            jsx.push(this._renderEditor(edit.row, edit.column));
        }

        let wkfix = this._chromeFix;
        if (wkfix.column !== -1 && wkfix.row !== -1 && (
            (wkfix.column < firstColumn) || (wkfix.column > lastColumn) ||
            (wkfix.row < firstRow) || (wkfix.row > lastRow)
        )) {
            jsx.push(this._renderCell(wkfix.row, wkfix.column));
        }

        return jsx;
    }

    private _renderHeader(
        out: JSX.Element[],
        type: HeaderType,
        index: number,
        header: IHeader,
        scrollPos: number,
        lock: { [id: string]: boolean },
        parent: boolean
    ) {
        let { $id, $children } = header;

        if (lock[$id]) {
            return;
        }

        lock[$id] = true;

        let style: React.CSSProperties = {
            position: 'absolute',
            zIndex: 1
        };

        let level = this.props.repository.getLevel(header);
        let headerSize = this.props.repository.getSize(header);

        if (type === HeaderType.Row) {
            style.left = this.props.repository.getLeftLevelPosition(level); // 0;
            style.width = this.props.repository.getLeftLevelWidth(level, header.$collapsed); // headersWidth;
            style.top = this.props.repository.getPosition(header) - scrollPos;
            style.height = headerSize;

            let levels = this.props.repository.leftLevels;
            if (level < (levels - 1) && (!$children || !$children.length)) {
                style.width = this.props.repository.offsetWidth - style.left;
            }
        } else {
            style.top = this.props.repository.getTopLevelPosition(level);
            style.height = this.props.repository.getTopLevelHeight(level, header.$collapsed); // headersHeight;
            style.left = this.props.repository.getPosition(header) - scrollPos;
            style.width = headerSize;

            let levels = this.props.repository.topLevels;
            if (level < (levels - 1) && (!$children || !$children.length)) {
                style.height = this.props.repository.offsetHeight - style.top;
            }
        }

        let selection = false;

        for (let s of this._selection) {
            if (type === HeaderType.Row) {
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

        let headerParent = this.props.repository.getParent(header);

        let cell = this.props.onRenderHeader({
            type, header, style, parent,
            selection: parent ? false : selection,
            parentHeader: headerParent,
            theme: this.props.theme,
            viewIndex: this.props.repository.getViewIndex(header)
        });

        out.push(React.cloneElement(React.Children.only(cell), {
            'x-type': type,
            'x-id': $id,
            key: $id,
            onMouseDown: this._onHeaderMouseDownHeader
        }));

        if (headerParent) {
            this._renderHeader(out, type, index, headerParent, scrollPos, lock, true);
        }
    }

    private _renderHeaders(type: HeaderType, scrollPos: number) {
        if (!this._lastOverscan) {
            return;
        }

        const { firstColumn, firstRow, lastColumn, lastRow } = this._lastOverscan;
        const isRow = type === HeaderType.Row;
        const first = isRow ? firstRow : firstColumn;
        const last = isRow ? lastRow : lastColumn;
        const max = isRow ? this._rowCount : this._columnCount;
        const headers = isRow ? this.props.repository.rows : this.props.repository.columns;

        let len = Math.max(0, Math.min(max - first, 1 + last - first));
        let jsx: JSX.Element[] = [];
        let lock: { [id: string]: boolean } = {};

        for (let i = 0; i < len; i++) {
            let ix = i + first;
            this._renderHeader(jsx, type, ix, headers[ix], scrollPos, lock, false);
        }

        return (
            <>
                {jsx}
            </>
        );
    }

    private _renderResizing({ scrollLeft, scrollTop }: IScrollViewUpdateEvent) {
        if (!this.props.onRenderResizer || !this.state.resizeHeaderPreview && !this.state.resizeLevelPreview) {
            return null;
        }

        let type: 'level' | 'header';
        let orientation: 'horizontal' | 'vertical';

        let styleInitial = {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 100
        } as React.CSSProperties;

        let styleChanged = {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 100
        } as React.CSSProperties;

        if (this.state.resizeHeaderPreview) {
            type = 'header';

            let { change, header } = this.state.resizeHeaderPreview;
            let headerType = this.props.repository.getHeaderType(header);
            let headerPosition = this.props.repository.getPosition(header);
            let headerSize = this.props.repository.getSize(header);

            if (headerType === HeaderType.Row) {
                orientation = 'horizontal';
                styleChanged.left = styleInitial.left = 0;
                styleChanged.right = styleInitial.right = 0;
                styleChanged.top = styleInitial.top = this.props.repository.offsetHeight + headerPosition - scrollTop;
                styleInitial.height = headerSize;
                styleChanged.height = headerSize + change;
            } else {
                orientation = 'vertical';
                styleChanged.top = styleInitial.top = 0;
                styleChanged.bottom = styleInitial.bottom = 0;
                styleChanged.left = styleInitial.left = this.props.repository.offsetWidth + headerPosition - scrollLeft;
                styleInitial.width = headerSize;
                styleChanged.width = headerSize + change;
            }
        }

        if (this.state.resizeLevelPreview) {
            type = 'level';

            let { change, header } = this.state.resizeLevelPreview;
            let headerType = this.props.repository.getHeaderType(header);
            let level = this.props.repository.getLevel(header);

            if (headerType === HeaderType.Row) { // resizing left level
                orientation = 'vertical';
                let position = this.props.repository.getLeftLevelPosition(level);
                let size = this.props.repository.getLeftLevelWidth(level);
                styleChanged.top = styleInitial.top = 0;
                styleChanged.bottom = styleInitial.bottom = 0;
                styleChanged.left = styleInitial.left = position;
                styleInitial.width = size;
                styleChanged.width = size + change;
            } else { // resizing top level
                orientation = 'horizontal';
                let position = this.props.repository.getTopLevelPosition(level);
                let size = this.props.repository.getTopLevelHeight(level);
                styleChanged.left = styleInitial.left = 0;
                styleChanged.right = styleInitial.right = 0;
                styleChanged.top = styleInitial.top = position;
                styleInitial.height = size;
                styleChanged.height = size + change;
            }
        }

        if (this.state.resizeHeaderPreview || this.state.resizeLevelPreview) {
            return (
                <>
                    {this.props.onRenderResizer({ type, orientation, style: styleInitial, resizer: 'initial', theme: this.props.theme })}
                    {this.props.onRenderResizer({ type, orientation, style: styleChanged, resizer: 'changed', theme: this.props.theme })}
                </>
            );
        }

        return null;
    }

    private _isAddressOutOfBounds(cell: IGridAddress) {
        let lastRow = this.props.repository.rows.length - 1;
        let lastCol = this.props.repository.columns.length - 1;

        return cell.column < 0 || cell.column > lastCol || cell.row < 0 || cell.row > lastRow;
    }

    private _getFilteredSelections() {
        let lastCol = this.props.repository.columns.length - 1;
        let lastRow = this.props.repository.rows.length - 1;

        return this._selection.filter(({ column, row }) => {
            return row <= lastRow && column <= lastCol;
        });
    }

    private _renderSelections(): JSX.Element[] {
        const ctr = this.props.repository;

        if (!ctr.columns.length || !ctr.rows.length) {
            return null;
        }

        let jsx = this._getFilteredSelections().map(({ row, column, width, height }, i) => {
            let l = ctr.getPosition(ctr.columns[column]);
            let t = ctr.getPosition(ctr.rows[row]);
            let w = ctr.columns.slice(column, column + width + 1).reduce((r, n) => r + ctr.getSize(n), 0);
            let h = ctr.rows.slice(row, row + height + 1).reduce((r, n) => r + ctr.getSize(n), 0);

            return this.props.onRenderSelection({
                key: i,
                active: false,
                edit: !!this.state.edit,
                theme: this.props.theme,
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

        if (!this._isAddressOutOfBounds(this._active)) {
            let rh = ctr.rows[this._active.row];
            let ch = ctr.columns[this._active.column];

            jsx.push(this.props.onRenderSelection({
                key: ax,
                active: true,
                edit: !!this.state.edit,
                theme: this.props.theme,
                style: {
                    position: 'absolute',
                    zIndex: ax,
                    left: ctr.getPosition(ch),
                    top: ctr.getPosition(rh),
                    width: ctr.getSize(ch),
                    height: ctr.getSize(rh)
                }
            }));
        }

        return jsx;
    }

    private _renderHeadersLayer = (event: IScrollViewUpdateEvent) => {
        const { clientWidth, clientHeight, scrollLeft, scrollTop } = event;

        return (
            <div
                style={{
                    width: clientWidth,
                    height: clientHeight,
                    pointerEvents: 'none',
                    zIndex: 1,
                    overflow: 'hidden',
                    position: 'absolute'
                }}
            >
                {!!this.props.repository.offsetHeight &&
                    <div
                        className={this._theme.classNameGridColumns}
                        style={{
                            ...this._theme.styleGridColumns,
                            pointerEvents: 'initial',
                            position: 'absolute',
                            overflow: 'hidden',
                            left: this.props.repository.offsetWidth,
                            top: 0,
                            right: 0,
                            height: this.props.repository.offsetHeight
                        }}
                    >
                        {this._renderHeaders(HeaderType.Column, scrollLeft)}
                    </div>
                }
                {!!this.props.repository.offsetWidth &&
                    <div
                        className={this._theme.classNameGridRows}
                        style={{
                            ...this._theme.styleGridRows,
                            pointerEvents: 'initial',
                            position: 'absolute',
                            overflow: 'hidden',
                            left: 0,
                            top: this.props.repository.offsetHeight,
                            bottom: 0,
                            width: this.props.repository.offsetWidth
                        }}
                    >
                        {this._renderHeaders(HeaderType.Row, scrollTop)}
                    </div>
                }
                {!!(this.props.repository.offsetHeight || this.props.repository.offsetWidth) &&
                    <div
                        className={this._theme.classNameGridCorner}
                        style={{
                            ...this._theme.styleGridCorner,
                            pointerEvents: 'initial',
                            position: 'absolute',
                            overflow: 'hidden',
                            left: 0,
                            top: 0,
                            height: this.props.repository.offsetHeight,
                            width: this.props.repository.offsetWidth
                        }}
                        onMouseDown={this._onCornerMouseDown}
                    >
                    </div>
                }
                {this._renderResizing(event)}
            </div>
        );
    }

    private _bodyRenderer = () => {
        return (
            <>
                <div
                    style={{
                        height: Math.max(1, this._lastView.rowsHeight),
                        width: Math.max(1, this._lastView.columnsWidth),
                        boxSizing: 'border-box',
                        position: 'relative',
                        marginLeft: this._headersWidth,
                        marginTop: this._headersHeight
                    }}
                >
                    {this._renderData()}
                </div>
                <div
                    style={{
                        position: 'absolute',
                        pointerEvents: 'none',
                        zIndex: 1,
                        left: this._headersWidth,
                        top: this._headersHeight
                    }}
                >
                    {this._renderSelections()}
                </div>
            </>
        );
    }

    public focus() {
        if (this._ref) {
            this._ref.focus();
            this._focused = true;
        }
    }

    public blur() {
        if (this._ref) {
            this._ref.blur();
        }
    }

    /** TODO: instead of using column index - use cell position and viewport minus scroll size */
    public scrollTo = (cell: { column?: number; row?: number; }) => {
        const ctr = this.props.repository;

        if (!this._refView || !ctr.columns.length || !ctr.rows.length) {
            return;
        }

        const { firstColumn, firstRow, lastColumn, lastRow } = this._lastView;
        let { column, row } = cell;

        if (row != null) {
            row = Math.min(Math.max(0, row), this._rowCount - 1);
            if (row <= firstRow || row >= lastRow) {
                let rowPos = ctr.getPosition(ctr.rows[row]);
                if (row <= firstRow) { // to top
                    this._refView.scrollTop = rowPos;
                } else { // to bottom
                    let rowSize = ctr.getSize(ctr.rows[row]);
                    this._refView.scrollTop = rowPos + rowSize - this.state.viewHeight + this._headersHeight;
                }
            }
        }

        if (column != null) {
            column = Math.min(Math.max(0, column), this._columnCount - 1);
            if (column <= firstColumn || column >= lastColumn) {
                let colPos = ctr.getPosition(ctr.columns[column]);
                if (column <= firstColumn) { // to left
                    this._refView.scrollLeft = colPos;
                } else { // to right
                    let colSize = ctr.getSize(ctr.columns[column]);
                    this._refView.scrollLeft = colPos + colSize - this.state.viewWidth + this._headersWidth;
                }
            }
        }
    }

    public openEditor = (cell: IGridAddress) => {
        if (this.props.readOnly) {
            return;
        }

        let e = this.state.edit;

        if (e) {
            if (e.row === cell.row && e.column === cell.column) {
                return;
            }

            this.closeEditor(true, () => {
                this.setState({ edit: cell });
            });
            return;
        }

        this.setState({ edit: cell });
    }

    public closeEditor = (commit: boolean, callback?: () => void) => {
        if (!this.state.edit) {
            this._currentEdit = null;
            this.focus();

            if (callback) {
                callback();
            }
            return;
        }

        this.setState({ edit: null }, () => {
            let e = this._currentEdit;
            this._currentEdit = null;
            this.focus();

            if (callback) {
                callback();
            }

            if (this.props.onUpdate && e) {
                let { col, row, nextValue, updatedValue } = e;

                if (commit && updatedValue) {
                    this.props.onUpdate({ cell: { row, column: col }, value: nextValue });
                }
            }
        });
    }

    public resizeHeaders(e: IGridResizeCombinedEvent) {
        if (this.props.onHeaderResize) {
            this.props.onHeaderResize(e);
        }
    }

    public updateSelection = ({ active, selection }: IUpdateSelectionEvent, callback?: () => void) => {
        if (!active && !selection) {
            return;
        }

        let nextActive = active || this._active;
        let nextSelection = selection || this._selection;
        let notifyActiveChanged = this._ctrlGetActiveNotifier(this._active, nextActive);
        let notifySelectionChanged = this._ctrlGetSelectionNotifier(this._selection, nextSelection);

        this.setState({
            active: nextActive,
            selection: nextSelection
        }, () => {
            if (callback) {
                callback();
            }

            if (notifyActiveChanged) {
                notifyActiveChanged();
            }

            if (notifySelectionChanged) {
                notifySelectionChanged();
            }
        });
    }

    public autoMeasure(headers: IHeader[], type: 'levels' | 'cells' = 'cells') {
        if (!headers || !headers.length || this.state.edit || !this.props.onAutoMeasure || !this.props.onHeaderResize || !this._lastView) {
            return;
        }

        const repository = this.props.repository;
        const { firstColumn, firstRow, lastRow, lastColumn } = this._lastView;

        if (firstColumn === -1 || firstRow === -1) {
            return;
        }

        const headerType = repository.getHeaderType(headers[0]);
        const diffHeaders = headers.filter(h => repository.getHeaderType(h) !== headerType);
        const cellNodes: ICellRenderBaseEvent[] = [];
        headers = headers.filter(h => repository.getHeaderType(h) === headerType);

        if (diffHeaders.length) {
            this.autoMeasure(diffHeaders, type);
        }

        if (type === 'cells') {
            const batch = headers.map(h => repository.getHeaderLeaves(h));
            const { columns, rows } = repository;

            for (let list of batch) {
                for (let h of list) {
                    let t = repository.getHeaderType(h);

                    if (t === HeaderType.Column) {
                        let c = repository.getViewIndex(h);

                        for (let r = firstRow; r <= lastRow; r++) {
                            if (columns[c] && rows[r]) {
                                cellNodes.push({
                                    column: c,
                                    row: r,
                                    columnHeader: columns[c],
                                    rowHeader: rows[r]
                                });
                            }
                        }
                    } else {
                        let r = repository.getViewIndex(h);

                        for (let c = firstColumn; c <= lastColumn; c++) {
                            if (columns[c] && rows[r]) {
                                cellNodes.push({
                                    column: c,
                                    row: r,
                                    columnHeader: columns[c],
                                    rowHeader: rows[r]
                                });
                            }
                        }
                    }
                }
            }
        }

        if (type === 'cells') {
            headers = repository.getNodesTopDown(headers);
        } else {
            const levels: { [level: number]: boolean } = [];
            headers.forEach((h) => {
                levels[repository.getLevel(h)] = true;
            });

            const list = (
                headerType === HeaderType.Column
                    ? repository.columns.slice(firstColumn, lastColumn + 1)
                    : repository.rows.slice(firstRow, lastRow + 1)
            );

            headers = repository.getNodesBottomUp(list).filter(h => !!levels[repository.getLevel(h)]);
        }

        const headerNodes = headers.map((h) => {
            return {
                index: repository.getViewIndex(h),
                type: repository.getHeaderType(h),
                level: repository.getLevel(h),
                header: h
            };
        });

        this.props.onAutoMeasure({
            cells: cellNodes,
            headers: headerNodes,
            data: this.props.data,
            callback: (result: IMeasureResult) => {
                this._onAutoMeasureApply(result, 'reset', type, headerType);
            }
        });
    }

    public previewResizeHeader(resizeHeaderPreview: { header: IHeader; change: number; }) {
        this.setState({ resizeHeaderPreview });
    }

    public previewResizeLevel(resizeLevelPreview: { header: IHeader; change: number; }) {
        this.setState({ resizeLevelPreview });
    }

    public componentDidMount() {
        document.body.addEventListener('contextmenu', this._onContextMenuListener = (e: any) => {
            if (this._blockContextMenu) {
                this._blockContextMenu = false;
                e.preventDefault();
            }
        });
    }

    public componentDidUpdate(pp: IGridProps) {
        const isSourceChanged = pp.data !== this.props.data;
        const isHeadersChanged = pp.repository !== this.props.repository;

        if (this.state.edit && (isSourceChanged || isHeadersChanged)) {
            this.closeEditor(false);
        }

        this._onAfterUpdate();
    }

    public componentWillUnmount() {
        this._detached = true;
        document.body.removeEventListener('contextmenu', this._onContextMenuListener);
        this._kbCtr.dispose();
        this._msCtr.dispose();
    }

    public render() {
        this._createView();
        this._createOverscan();

        const ScrollView = this.props.scrollViewClass || FallbackScrollView;

        return (
            <Context.Provider value={{ grid: this, repository: this.props.repository }}>
                <div
                    className={this._theme.classNameGrid}
                    tabIndex={this.props.tabIndex == null ? -1 : this.props.tabIndex}
                    ref={this._onRef}
                    onBlur={this._onBlur}
                    onFocus={this._onFocus}
                    style={{
                        display: 'block',
                        height: '100%',
                        width: '100%',
                        position: 'relative',
                        userSelect: 'none',
                        outline: 'none',
                        overflow: 'hidden',
                        ...this._theme.styleGrid
                    }}
                    onKeyDown={this._onKeyDown}
                    onMouseLeave={this._onRootMouseLeave}
                    onMouseEnter={this._onRootMouseEnter}
                    onMouseDown={this._onRootMouseDown}
                >
                    <ScrollView
                        className={this._theme.classNameScrollView}
                        ref={this._onRefView}
                        onScroll={this._onScrollViewUpdate}
                        style={this._scrollerStyle}
                        headersRenderer={this._renderHeadersLayer}
                        bodyRenderer={this._bodyRenderer}
                    />
                </div>
            </Context.Provider>
        );
    }
}

export default Grid;
