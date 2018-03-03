import * as React from 'react';
import * as PropTypes from 'prop-types';
import ScrollView, { IScrollViewUpdateEvent } from './scrollview';
import {
    debounce, RenderThrottler, KeyboardController,
    IUpdateSelectionEvent, IKeyboardControllerRemoveEvent,
    MouseController, IKeyboardControllerPasteEvent
} from '../controllers';
import {
    IHeader, HeaderResizeBehavior, HeadersContainer, HeaderType
} from '../models';
import {
    IGridProps, IGridResizeCombinedEvent, IMeasureResult, ICellRenderBaseEvent, ICellRendererEvent,
    IGridAddress, IGridSelection, IGridView, IGridOverscan
} from './types';

export class Grid extends React.PureComponent<IGridProps, any> {
    /** React v17 deprecated */
    static childContextTypes = {
        grid: PropTypes.object,
        headers: PropTypes.object
    };

    /** React v17 deprecated */
    getChildContext(this: Grid) {
        return {
            grid: this,
            headers: this.props.headers as HeadersContainer /*typescript workaround*/
        };
    }

    private _blockContextMenu = false;
    private _onContextMenuListener: any = null;
    private _rt = new RenderThrottler();
    private _scrollUpdateTrottled = this._rt.create();
    private _ref: HTMLDivElement = null;
    private _refView: ScrollView = null;
    private _scrollerProps: React.HTMLProps<HTMLDivElement> = { style: { willChange: 'transform', zIndex: 0 } };
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
        scrollbarSize: 0,
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

    constructor(p: IGridProps, c: any) {
        super(p, c);

        this._onAfterUpdate = debounce(500, this._onAfterUpdate.bind(this));

        const getState = () => ({
            active: this.state.active,
            editor: this.state.edit,
            selection: this.state.selection,
            focused: this._focused,
            columns: this._columnCount,
            rows: this._rowCount,
            view: this._lastView,
            readOnly: this.props.readOnly
        });

        const onScroll = this.scrollTo.bind(this);
        const onUpdateSelection = ({ active, selection }: IUpdateSelectionEvent, callback: () => void) => {
            if (!active && !selection) {
                return;
            }

            this.setState({
                active: active || this.state.active,
                selection: selection || this.state.selection
            }, callback);
        };

        const onRightClick = (cell: IGridAddress) => {
            if (this.props.onRightClick) {
                this.props.onRightClick(cell);
            }
        };

        const onCopy = (cells: IGridAddress[], withHeaders: boolean) => {
            if (this.props.onCopy) {
                this.props.onCopy({ withHeaders, cells });
            }
        };

        const onPaste = ({ clipboard, getAllSelectedCells, getLastSelectedCells }: IKeyboardControllerPasteEvent) => {
            if (this.props.onPaste) {
                this.props.onPaste({
                    clipboard,
                    getAllSelectedCells,
                    getLastSelectedCells,
                    target: {
                        ...this.state.active
                    }
                });
            }
        };

        const onNullify = (cells: IGridAddress[]) => {
            if (this.props.onNullify) {
                this.props.onNullify({ cells });
            }
        };

        const onRemove = (event: IKeyboardControllerRemoveEvent) => {
            if (this.props.onRemove) {
                this.props.onRemove(event);
            }
        };

        const onSpace = (cells: IGridAddress[]) => {
            if (this.props.onSpace) {
                this.props.onSpace({ cells });
            }
        };

        this._kbCtr = new KeyboardController({
            getState,
            onCloseEditor: this.closeEditor,
            onOpenEditor: this.openEditor,
            onScroll,
            onUpdateSelection,
            onCopy,
            onPaste,
            onNullify,
            onRemove,
            onSpace
        });

        this._msCtr = new MouseController({
            getState,
            onCloseEditor: this.closeEditor,
            onOpenEditor: this.openEditor,
            onScroll,
            onUpdateSelection,
            onRightClick
        });
    }

    private get _theme() {
        let theme = { ...(this.props.theme || {}) };
        theme.styleGrid = theme.styleGrid || {};
        theme.styleGridColumns = theme.styleGridColumns || {};
        theme.styleGridRows = theme.styleGridRows || {};
        theme.styleGridCorner = theme.styleGridCorner || {};
        return theme;
    }

    private get _columnCount() {
        return this.props.headers ? this.props.headers.columns.length : 0;
    }

    private get _rowCount() {
        return this.props.headers ? this.props.headers.rows.length : 0;
    }

    private get _headersHeight() {
        return this.props.headers.headersHeight || 0;
    }

    private get _headersWidth() {
        return this.props.headers.headersWidth || 0;
    }

    private _onRef = (r: HTMLDivElement) => {
        this._ref = r;
    }

    private _onRefView = (r: ScrollView) => {
        this._refView = r;
    }

    private _onBlur = () => {
        this._focused = false;
    }

    private _onFocus = () => {
        this._focused = true;
    }

    private _onScrollViewUpdate = (e: IScrollViewUpdateEvent) => {
        this._scrollUpdateTrottled(() => {
            if (this.state.viewWidth !== e.clientWidth || this.state.viewHeight !== e.clientHeight) {
                this.setState({ viewWidth: e.clientWidth, viewHeight: e.clientHeight, scrollbarSize: e.scrollbarSize });
            }

            if (this.state.scrollLeft !== e.scrollLeft) {
                this.setState({ scrollLeft: e.scrollLeft, scrollbarSize: e.scrollbarSize });
            }

            if (this.state.scrollTop !== e.scrollTop) {
                this.setState({ scrollTop: e.scrollTop, scrollbarSize: e.scrollbarSize });
            }
        });
    }

    private _onAutoMeasureApply({ cells, headers }: IMeasureResult, behavior: HeaderResizeBehavior) {
        cells = (cells || []).filter(v => !!v);
        headers = (headers || []).filter(v => !!v);

        const ctr = this.props.headers;
        const isReset = behavior === 'reset';

        const combinedEvent: IGridResizeCombinedEvent = {
            behavior
        };

        if (cells.length) {
            const columnHeaders = ctr.columns;
            const rowHeaders = ctr.rows;

            let columns: { [colIndex: string]: number } = {};
            let rows: { [rowIndex: string]: number } = {};

            for (let { row, column, height, width } of cells) {
                columns[column] = columns[column] == null ? width : Math.max(width, columns[column]);
                rows[row] = rows[row] == null ? height : Math.max(height, rows[row]);
            }

            let ch = Object
                .keys(columns)
                .map(k => ({ columnIndex: Number(k), width: columns[k] }))
                .filter(({ width, columnIndex }) => {
                    let h = columnHeaders[columnIndex];
                    return h && (isReset || !ctr.getManualResized(h) && h.$size < width);
                })
                .map(({ columnIndex, width }) => ({
                    header: columnHeaders[columnIndex],
                    size: width,
                    type: ctr.getHeaderType(columnHeaders[columnIndex])
                }));

            let rh = Object
                .keys(rows)
                .map(k => ({ rowIndex: Number(k), height: rows[k] }))
                .filter(({ rowIndex, height }) => {
                    let h = rowHeaders[rowIndex];
                    return h && (isReset || !ctr.getManualResized(h) && h.$size < height);
                })
                .map(({ rowIndex, height }) => ({
                    header: rowHeaders[rowIndex],
                    size: height,
                    type: ctr.getHeaderType(rowHeaders[rowIndex])
                }));

            if (ch.length || rh.length) {
                combinedEvent.headers = [...ch, ...rh];
            }
        }

        if (headers.length) {
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

            const top = Object.keys(topLevels).map((k) => {
                const level = Number(k);
                const size = topLevels[level];

                if (size == null || !isReset && size < ctr.getTopLevelHeight(level)) {
                    return null;
                }

                return {
                    level, size,
                    type: HeaderType.Column
                };
            }).filter(v => !!v);

            const left = Object.keys(leftLevels).map((k) => {
                const level = Number(k);
                const size = leftLevels[level];

                if (size == null || !isReset && size < ctr.getLeftLevelWidth(level)) {
                    return null;
                }

                return {
                    level, size,
                    type: HeaderType.Row
                };
            }).filter(v => !!v);


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

        if (firstColumn === -1 || firstRow === -1) {
            return;
        }

        const ctr = this.props.headers;
        const { columns, rows } = ctr;
        const cells: ICellRenderBaseEvent[] = [];

        for (let r = firstRow; r <= lastRow; r++) {
            for (let c = firstColumn; c <= lastColumn; c++) {
                cells.push({
                    columnIndex: c,
                    rowIndex: r,
                    source: this.props.source,
                    columnHeader: columns[c],
                    rowHeader: rows[r]
                });
            }
        }

        if (!cells.length) {
            return;
        }

        const headers = [
            ...columns.slice(firstColumn, lastColumn + 1),
            ...rows.slice(firstRow, lastRow + 1)
        ].map((h) => {
            return {
                index: ctr.getViewIndex(h),
                type: ctr.getHeaderType(h),
                level: ctr.getLevel(h),
                source: this.props.source,
                header: h
            };
        });

        this.props.onAutoMeasure({
            cells,
            headers,
            callback: (result: IMeasureResult) => {
                this._onAutoMeasureApply(result, 'auto');
            }
        });
    }

    private _onAfterUpdate() {
        this._onAutoMeasure();
    }

    private _onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        e.persist();
        this._kbCtr.keydown(e);
    }

    private _onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        e.persist();
        let row = Number(e.currentTarget.getAttribute('x-row'));
        let column = Number(e.currentTarget.getAttribute('x-col'));

        this.focus();

        this._msCtr.mousedown(e, row, column);
    }

    private _onMouseDownHeader = (e: React.MouseEvent<HTMLElement>) => {
        e.persist();
        let type: HeaderType = Number(e.currentTarget.getAttribute('x-type'));
        let id = e.currentTarget.getAttribute('x-id');
        let h = this.props.headers.getHeader(id);
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

        let leaves = this.props.headers.getHeaderLeaves(h);
        let indices = leaves.map(v => this.props.headers.getViewIndex(v));

        if (!indices.length) {
            return;
        }

        let min = Math.min(...indices);
        let max = Math.max(...indices);

        this._msCtr.headerdown(e, type, min, max);
    }

    private _onMouseDownCorner = () => {
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

    private _onMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
        let row = Number(e.currentTarget.getAttribute('x-row'));
        let column = Number(e.currentTarget.getAttribute('x-col'));
        this._msCtr.mouseenter(row, column);
    }

    private _onRootMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        e.persist();
        let x = e.pageX;
        let y = e.pageY;
        let rect = this._ref.getBoundingClientRect();
        this._msCtr.rootleave(x, y, rect);
    }

    private _onRootMouseEnter = () => {
        this._msCtr.rootenter();
    }

    private _onRootMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 2) {
            this._blockContextMenu = true;
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

        for (let rh of this.props.headers.rows) {
            if (firstRow === -1 && rowsHeight >= st - rh.$size) {
                firstRow = rowIndex;
            }

            rowsHeight += rh.$size;

            if (lastRow === -1 && rowsHeight >= st + vh /*+ (this._theme.scrollbarWidth || 0)*/) {
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

        for (let ch of this.props.headers.columns) {
            if (firstColumn === -1 && columnsWidth >= sl - ch.$size) {
                firstColumn = colIndex;
            }

            columnsWidth += ch.$size;

            if (lastColumn === -1 && columnsWidth >= sl + vw /*+ (this._theme.scrollbarWidth || 0)*/) {
                lastColumn = colIndex;
                break;
            }

            colIndex++;
        }

        if (lastColumn === -1 && firstColumn !== -1) {
            lastColumn = colIndex;
        }

        let rhLast = this.props.headers.rows[this.props.headers.rows.length - 1];
        let chLast = this.props.headers.columns[this.props.headers.columns.length - 1];
        rowsHeight = this.props.headers.getPosition(rhLast) + rhLast.$size;
        columnsWidth = this.props.headers.getPosition(chLast) + chLast.$size;

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
        let rh = this.props.headers.rows[row];
        let ch = this.props.headers.columns[col];

        return {
            rowIndex: row,
            columnIndex: col,
            rowHeader: rh,
            columnHeader: ch,
            active: row === this.state.active.row && col === this.state.active.column,
            source: this.props.source,
            theme: this.props.theme,
            style: {
                top: this.props.headers.getPosition(rh),
                left: this.props.headers.getPosition(ch),
                height: rh.$size,
                width: ch.$size,
                position: 'absolute',
                zIndex: 1
            }
        } as ICellRendererEvent;
    }

    private _renderCell(row: number, col: number) {
        let cell = this.props.onRenderCell(this._prepareCellProps(row, col));

        return React.cloneElement(React.Children.only(cell), {
            'x-row': row,
            'x-col': col,
            key: `C${row}x${col}`,
            onMouseDown: this._onMouseDown,
            onMouseEnter: this._onMouseEnter
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

        let cellProps = this._prepareCellProps(row, col);
        let cell = this.props.onRenderEditor({
            ...cellProps,
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
        )
        ) {
            jsx.push(this._renderEditor(edit.row, edit.column));
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

        let level = this.props.headers.getLevel(header);

        if (type === HeaderType.Row) {
            style.left = this.props.headers.getLeftLevelPosition(level); // 0;
            style.width = this.props.headers.getLeftLevelWidth(level); // headersWidth;
            style.top = this.props.headers.getPosition(header) - scrollPos;
            style.height = header.$size;

            let levels = this.props.headers.leftLevels;
            if (level < (levels - 1) && (!$children || !$children.length)) {
                style.width = this.props.headers.headersWidth - style.left;
            }
        } else {
            style.top = this.props.headers.getTopLevelPosition(level);
            style.height = this.props.headers.getTopLevelHeight(level); // headersHeight;
            style.left = this.props.headers.getPosition(header) - scrollPos;
            style.width = header.$size;

            let levels = this.props.headers.topLevels;
            if (level < (levels - 1) && (!$children || !$children.length)) {
                style.height = this.props.headers.headersHeight - style.top;
            }
        }

        let selection = false;

        for (let s of this.state.selection) {
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

        let headerParent = this.props.headers.getParent(header);

        let cell = this.props.onRenderHeader({
            type, header, style, parent,
            selection: parent ? false : selection,
            parentHeader: headerParent,
            theme: this.props.theme,
            viewIndex: this.props.headers.getViewIndex(header)
        });

        out.push(React.cloneElement(React.Children.only(cell), {
            'x-type': type,
            'x-id': $id,
            key: $id,
            onMouseDown: this._onMouseDownHeader
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
        const headers = isRow ? this.props.headers.rows : this.props.headers.columns;

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
            pointerEvents: 'none'
        } as React.CSSProperties;

        let styleChanged = {
            position: 'absolute',
            pointerEvents: 'none'
        } as React.CSSProperties;

        if (this.state.resizeHeaderPreview) {
            type = 'header';

            let { change, header } = this.state.resizeHeaderPreview;
            let headerType = this.props.headers.getHeaderType(header);
            let headerPosition = this.props.headers.getPosition(header);

            if (headerType === HeaderType.Row) {
                orientation = 'horizontal';
                styleChanged.left = styleInitial.left = 0;
                styleChanged.right = styleInitial.right = 0;
                styleChanged.top = styleInitial.top = this.props.headers.headersHeight + headerPosition - scrollTop;
                styleInitial.height = header.$size;
                styleChanged.height = header.$size + change;
            } else {
                orientation = 'vertical';
                styleChanged.top = styleInitial.top = 0;
                styleChanged.bottom = styleInitial.bottom = 0;
                styleChanged.left = styleInitial.left = this.props.headers.headersWidth + headerPosition - scrollLeft;
                styleInitial.width = header.$size;
                styleChanged.width = header.$size + change;
            }
        }

        if (this.state.resizeLevelPreview) {
            type = 'level';

            let { change, header } = this.state.resizeLevelPreview;
            let headerType = this.props.headers.getHeaderType(header);
            let level = this.props.headers.getLevel(header);

            if (headerType === HeaderType.Row) { // resizing left level
                orientation = 'vertical';
                let position = this.props.headers.getLeftLevelPosition(level);
                let size = this.props.headers.getLeftLevelWidth(level);
                styleChanged.top = styleInitial.top = 0;
                styleChanged.bottom = styleInitial.bottom = 0;
                styleChanged.left = styleInitial.left = position - scrollLeft;
                styleInitial.width = size;
                styleChanged.width = size + change;
            } else { // resizing top level
                orientation = 'horizontal';
                let position = this.props.headers.getTopLevelPosition(level);
                let size = this.props.headers.getTopLevelHeight(level);
                styleChanged.left = styleInitial.left = 0;
                styleChanged.right = styleInitial.right = 0;
                styleChanged.top = styleInitial.top = position - scrollTop;
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

    private _renderHeaderContainers = (event: IScrollViewUpdateEvent) => {
        const { clientWidth, clientHeight, scrollLeft, scrollTop } = event;

        return (
            <div
                style={{
                    width: clientWidth/* + this._theme.scrollSize*/,
                    height: clientHeight/* + this._theme.scrollSize*/,
                    pointerEvents: 'none',
                    zIndex: 1
                }}
            >
                {!!this.props.headers.headersHeight &&
                    <div
                        className={this._theme.classNameGridColumns}
                        style={{
                            ...this._theme.styleGridColumns,
                            pointerEvents: 'initial',
                            position: 'absolute',
                            overflow: 'hidden',
                            left: this.props.headers.headersWidth,
                            top: 0,
                            right: 0,
                            height: this.props.headers.headersHeight
                        }}
                    >
                        {this._renderHeaders(HeaderType.Column, scrollLeft)}
                    </div>
                }
                {!!this.props.headers.headersWidth &&
                    <div
                        className={this._theme.classNameGridRows}
                        style={{
                            ...this._theme.styleGridRows,
                            pointerEvents: 'initial',
                            position: 'absolute',
                            overflow: 'hidden',
                            left: 0,
                            top: this.props.headers.headersHeight,
                            bottom: 0,
                            width: this.props.headers.headersWidth
                        }}
                    >
                        {this._renderHeaders(HeaderType.Row, scrollTop)}
                    </div>
                }
                {!!(this.props.headers.headersHeight || this.props.headers.headersWidth) &&
                    <div
                        className={this._theme.classNameGridCorner}
                        style={{
                            ...this._theme.styleGridCorner,
                            pointerEvents: 'initial',
                            position: 'absolute',
                            overflow: 'hidden',
                            left: 0,
                            top: 0,
                            height: this.props.headers.headersHeight,
                            width: this.props.headers.headersWidth
                        }}
                        onMouseDown={this._onMouseDownCorner}
                    >
                    </div>
                }
                {this._renderResizing(event)}
            </div>
        );
    }

    private _renderSelections(): JSX.Element[] {
        if (!this.props.headers.columns.length || !this.props.headers.rows.length) {
            return null;
        }

        let jsx = this.state.selection.map(({ row, column, width, height }, i) => {
            let l = this.props.headers.getPosition(this.props.headers.columns[column]);
            let t = this.props.headers.getPosition(this.props.headers.rows[row]);
            let w = this.props.headers.columns.slice(column, column + width + 1).reduce((r, n) => r + n.$size, 0);
            let h = this.props.headers.rows.slice(row, row + height + 1).reduce((r, n) => r + n.$size, 0);

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

        let rh = this.props.headers.rows[this.state.active.row];
        let ch = this.props.headers.columns[this.state.active.column];

        jsx.push(this.props.onRenderSelection({
            key: ax,
            active: true,
            edit: !!this.state.edit,
            theme: this.props.theme,
            style: {
                position: 'absolute',
                zIndex: ax,
                left: this.props.headers.getPosition(ch),
                top: this.props.headers.getPosition(rh),
                width: ch.$size,
                height: rh.$size
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

    /** TODO: instead of using column index - use cell position and viewport minus scroll size */
    public scrollTo(cell: { column?: number; row?: number; }) {
        if (!this._refView || !this.props.headers.columns.length || !this.props.headers.rows.length) {
            return;
        }

        const { firstColumn, firstRow, lastColumn, lastRow } = this._lastView;
        let { column, row } = cell;

        if (row != null) {
            row = Math.min(Math.max(0, row), this._rowCount - 1);
            if (row <= firstRow || row >= lastRow) {
                let rowPos = this.props.headers.getPosition(this.props.headers.rows[row]);
                if (row <= firstRow) { // to top
                    this._refView.scrollTop = rowPos;
                } else { // to bottom
                    let rowSize = this.props.headers.rows[row].$size;
                    this._refView.scrollTop = rowPos + rowSize - this.state.viewHeight + this._headersHeight;
                }
            }
        }

        if (column != null) {
            column = Math.min(Math.max(0, column), this._columnCount - 1);
            if (column <= firstColumn || column >= lastColumn) {
                let colPos = this.props.headers.getPosition(this.props.headers.columns[column]);
                if (column <= firstColumn) { // to left
                    this._refView.scrollLeft = colPos;
                } else { // to right
                    let colSize = this.props.headers.columns[column].$size;
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

    public autoMeasure(headers: IHeader[]) {
        if (this.state.edit || !this.props.onAutoMeasure || !this.props.onHeaderResize || !this._lastView) {
            return;
        }

        const ctr = this.props.headers;
        const { firstColumn, firstRow, lastRow, lastColumn } = this._lastView;

        if (firstColumn === -1 || firstRow === -1) {
            return;
        }

        const batch = headers.map(h => ctr.getHeaderLeaves(h));
        const { columns, rows } = ctr;
        const cells: ICellRenderBaseEvent[] = [];

        for (let list of batch) {
            for (let h of list) {
                let t = ctr.getHeaderType(h);

                if (t === HeaderType.Column) {
                    let c = ctr.getViewIndex(h);

                    for (let r = firstRow; r <= lastRow; r++) {
                        cells.push({
                            columnIndex: c,
                            rowIndex: r,
                            source: this.props.source,
                            columnHeader: columns[c],
                            rowHeader: rows[r]
                        });
                    }
                } else {
                    let r = ctr.getViewIndex(h);

                    for (let c = firstColumn; c <= lastColumn; c++) {
                        cells.push({
                            columnIndex: c,
                            rowIndex: r,
                            source: this.props.source,
                            columnHeader: columns[c],
                            rowHeader: rows[r]
                        });
                    }
                }
            }
        }

        if (!cells.length) {
            return;
        }

        const headerNodes = ctr.getNodesByChildren(headers).map((h) => {
            return {
                index: ctr.getViewIndex(h),
                type: ctr.getHeaderType(h),
                level: ctr.getLevel(h),
                source: this.props.source,
                header: h
            };
        });

        this.props.onAutoMeasure({
            cells,
            headers: headerNodes,
            callback: (result: IMeasureResult) => {
                this._onAutoMeasureApply(result, 'reset');
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
        if (this.state.edit && pp.source !== this.props.source) {
            this.closeEditor(false);
        }

        this._onAfterUpdate();
    }

    public componentWillUnmount() {
        document.body.removeEventListener('contextmenu', this._onContextMenuListener);
        this._kbCtr.dispose();
        this._msCtr.dispose();
    }

    public render() {
        this._createView();
        this._createOverscan();

        const { rowsHeight, columnsWidth } = this._lastView;

        return (
            <div
                className={this._theme.classNameGrid}
                tabIndex={this.props.tabIndex == null ? -1 : this.props.tabIndex}
                ref={this._onRef}
                onBlur={this._onBlur}
                onFocus={this._onFocus}
                style={{
                    height: '100%',
                    width: '100%',
                    position: 'relative',
                    userSelect: 'none',
                    outline: 'none',
                    ...this._theme.styleGrid,
                    overflow: 'hidden'
                }}
                onKeyDown={this._onKeyDown}
                onMouseLeave={this._onRootMouseLeave}
                onMouseEnter={this._onRootMouseEnter}
                onMouseDown={this._onRootMouseDown}
            >
                <ScrollView
                    ref={this._onRefView}
                    onScroll={this._onScrollViewUpdate}
                    scrollerProps={this._scrollerProps}
                    renderAfter={this._renderHeaderContainers}
                    {...this.props.theme}
                >
                    <div
                        style={{
                            height: rowsHeight + this.state.scrollbarSize,
                            width: columnsWidth + this.state.scrollbarSize,
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
                </ScrollView>
            </div>
        );
    }
}
