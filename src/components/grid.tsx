import * as React from 'react';
import ScrollView, { IScrollViewUpdateEvent } from './scrollview';
import {
    debounce, Shallow, RenderThrottler, KeyboardController,
    IUpdateSelectionEvent, IKeyboardControllerRemoveEvent,
    MouseController
} from '../controllers';
import {
    IGridAddress, IGridSelection, IGridView, IGridOverscan
} from '../types';
import {
    Headers, Header
} from '../models';

const Style = require('./grid.scss');

//#region interfaces
export interface ICellRendererEvent {
    rowIndex: number;
    columnIndex: number;
    active: boolean;
    style: React.CSSProperties;
    source: any;
    rowHeader: Header;
    columnHeader: Header;
}

export interface ICellEditorEvent extends ICellRendererEvent {
    /** Request to close editor. */
    close: (commit: boolean) => void;
    /** Set update for this cell. */
    update: (nextValue: any) => void;
}

export interface IHeaderRendererEvent {
    type: 'rows' | 'columns';
    index: number;
    selection: boolean;
    style: React.CSSProperties;
    header: Header;
}

export interface ISelectionRendererEvent {
    key: number;
    style: React.CSSProperties;
    active: boolean;
    edit: boolean;
}

export interface IGridSpaceEvent {
    cells: IGridAddress[];
}

export interface IGridRemoveEvent extends IKeyboardControllerRemoveEvent { }

export interface IGridNullifyEvent extends IGridSpaceEvent { }

export interface IGridCopyEvent {
    cells: IGridAddress[];
    withHeaders: boolean;
}

export interface IGridPasteEvent {
    target: IGridAddress;
    clipboard: DataTransfer;
}

export interface IGridUpdateEvent {
    cell: IGridAddress;
    value: any;
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

    /** Reference to headers container. This object is mutable! */
    refHeaders: Headers;

    /** Not used directly by Component, but provided to the cell renderer. */
    source?: any;

    /** Prevent editors to appear. `onNullify`, `onRemove`, `onSpace` and `onPaste` events will not be invoked. */
    readOnly?: boolean;

    overscanRows?: number;
    overscanColumns?: number;

    /** Add classnames here. */
    classes?: IGridClasses;

    /** Add styles here. Some positioning properties will be ignored. */
    styles?: IGridStyles;

    /** Cell renderer. Required. Some event handlers will be bound. */
    onRenderCell: (e: ICellRendererEvent) => JSX.Element;

    /** Header renderer. Required. */
    onRenderHeader: (e: IHeaderRendererEvent) => JSX.Element;

    /** Selection renderer. Required. If active property is true - this renders active cell selection. */
    onRenderSelection: (e: ISelectionRendererEvent) => JSX.Element;

    /** Editor renderer. Optional. */
    onRenderEditor?: (e: ICellEditorEvent) => JSX.Element;

    /** Invoked with all selected cells when `SPACE` key is pressed. Usefull for checkbox cells. */
    onSpace?: (e: IGridSpaceEvent) => void;

    /** Invoked with all selected rows and columns when `CMD`/`CTRL`+`DELETE`/`BACKSPACE` keys are pressed. Remove records here. */
    onRemove?: (e: IGridRemoveEvent) => void;

    /** Invoked with all selected cells when `DELETE`/`BACKSPACE` keys are pressed. Replace data with nulls here. */
    onNullify?: (e: IGridNullifyEvent) => void;

    /** Invoked on `COPY` event, provides selected cells and flag `withHeaders` when ALT key is pressed. */
    onCopy?: (e: IGridCopyEvent) => void;

    /** Invoked on `PASTE` event, provides target cell and clipboard `DataTransfer` object. */
    onPaste?: (e: IGridPasteEvent) => void;

    /** Invoked on cell right click. */
    onRightClick?: (e: IGridAddress) => void;

    /** Invoked on editor close when value was changed. */
    onUpdate?: (e: IGridUpdateEvent) => void;
}
//#endregion

export class Grid extends React.PureComponent<IGridProps, any> {
    private _shallow = {
        colHeaders: Shallow<React.CSSProperties>(),
        rowHeaders: Shallow<React.CSSProperties>(),
        crnHeaders: Shallow<React.CSSProperties>()
    };

    private _scrollSize = 15;
    private _rt = new RenderThrottler();
    private _scrollUpdateTrottled = this._rt.create();
    private _ref: HTMLDivElement = null;
    private _refView: ScrollView = null;
    private _refScroller: HTMLDivElement = null;
    private _scrollerProps: React.HTMLProps<HTMLDivElement> = { style: { willChange: 'transform' } };
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
        }] as IGridSelection[]
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

        const onPaste = (clipboard: DataTransfer) => {
            if (this.props.onPaste) {
                this.props.onPaste({ clipboard, target: { ...this.state.active } });
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

    private get _columnCount() {
        return this.props.refHeaders ? this.props.refHeaders.columns.length : 0;
    }

    private get _rowCount() {
        return this.props.refHeaders ? this.props.refHeaders.rows.length : 0;
    }

    private get _headersHeight() {
        return this.props.refHeaders.headersHeight || 0;
    }

    private get _headersWidth() {
        return this.props.refHeaders.headersWidth || 0;
    }

    private _onRef = (r: HTMLDivElement) => {
        this._ref = r;
    }

    private _onRefView = (r: ScrollView) => {
        this._refView = r;
    }

    private _onRefScroller = (r: HTMLDivElement) => {
        this._refScroller = r;
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

    private _createView() {
        const sl = this.state.scrollLeft;
        const st = this.state.scrollTop;
        const vw = this.state.viewWidth - this._headersWidth;
        const vh = this.state.viewHeight - this._headersHeight;

        let rowsHeight = 0;
        let firstRow = -1;
        let lastRow = -1;
        let rowIndex = 0;

        for (let rh of this.props.refHeaders.rows) {
            if (firstRow === -1 && rowsHeight >= st - rh.size) {
                firstRow = rowIndex;
            }

            rowsHeight += rh.size;

            if (lastRow === -1 && rowsHeight >= st + vh + this._scrollSize) {
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

        for (let ch of this.props.refHeaders.columns) {
            if (firstColumn === -1 && columnsWidth >= sl - ch.size) {
                firstColumn = colIndex;
            }

            columnsWidth += ch.size;

            if (lastColumn === -1 && columnsWidth >= sl + vw + this._scrollSize) {
                lastColumn = colIndex;
                break;
            }

            colIndex++;
        }

        if (lastColumn === -1 && firstColumn !== -1) {
            lastColumn = colIndex;
        }

        let rhLast = this.props.refHeaders.rows[this.props.refHeaders.rows.length - 1];
        let chLast = this.props.refHeaders.columns[this.props.refHeaders.columns.length - 1];
        rowsHeight = rhLast.position + rhLast.size;
        columnsWidth = chLast.position + chLast.size;

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
        let rh = this.props.refHeaders.rows[row];
        let ch = this.props.refHeaders.columns[col];

        return {
            rowIndex: row,
            columnIndex: col,
            rowHeader: rh,
            columnHeader: ch,
            active: row === this.state.active.row && col === this.state.active.column,
            source: this.props.source,
            style: {
                top: rh.position,
                left: ch.position,
                height: rh.size,
                width: ch.size,
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
            (edit.column < firstColumn) || (edit.column > lastRow) ||
            (edit.row < firstRow) || (edit.row > lastRow)
        )
        ) {
            jsx.push(this._renderEditor(edit.row, edit.column));
        }

        return jsx;
    }

    private _renderHeader(type: 'rows' | 'columns', index: number, header: Header, scrollPos: number) {
        let style: React.CSSProperties = {
            position: 'absolute',
            zIndex: 1
        };

        let h = this.props.refHeaders[type === 'rows' ? 'rows' : 'columns'][index];

        if (type === 'rows') {
            style.left = 0;
            style.top = h.position - scrollPos;
            style.height = h.size;
            style.width = this.props.refHeaders.headersWidth;
        } else {
            style.left = h.position - scrollPos;
            style.top = 0;
            style.height = this.props.refHeaders.headersHeight;
            style.width = h.size;
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
        const headers = type === 'rows' ? this.props.refHeaders.rows : this.props.refHeaders.columns;

        let len = Math.max(0, Math.min(max - first, 1 + last - first));
        let jsx: JSX.Element[] = [];

        for (let i = 0; i < len; i++) {
            let ix = i + first;
            jsx.push(this._renderHeader(type, ix, headers[ix], scrollPos));
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
                {!!this.props.refHeaders.headersHeight &&
                    <div
                        className={cnColumns}
                        style={this._shallow.colHeaders({
                            ...(this.props.styles && this.props.styles.columns || {}),
                            left: this.props.refHeaders.headersWidth,
                            top: 0,
                            right: 0,
                            height: this.props.refHeaders.headersHeight
                        })}
                    >
                        {this._renderHeaders('columns', scrollLeft)}
                    </div>
                }
                {!!this.props.refHeaders.headersWidth &&
                    <div
                        className={cnRows}
                        style={this._shallow.rowHeaders({
                            ...(this.props.styles && this.props.styles.rows || {}),
                            left: 0,
                            top: this.props.refHeaders.headersHeight,
                            bottom: 0,
                            width: this.props.refHeaders.headersWidth
                        })}
                    >
                        {this._renderHeaders('rows', scrollTop)}
                    </div>
                }
                {!!(this.props.refHeaders.headersHeight || this.props.refHeaders.headersWidth) &&
                    <div
                        className={cnCorner}
                        style={this._shallow.crnHeaders({
                            ...(this.props.styles && this.props.styles.corner || {}),
                            left: 0,
                            top: 0,
                            height: this.props.refHeaders.headersHeight,
                            width: this.props.refHeaders.headersWidth
                        })}
                    >
                    </div>
                }
            </div>
        );
    }

    private _renderSelections(): JSX.Element[] {
        if (!this.props.refHeaders.columns.length || !this.props.refHeaders.rows.length) {
            return null;
        }

        let jsx = this.state.selection.map(({ row, column, width, height }, i) => {
            let l = this.props.refHeaders.columns[column].position;
            let t = this.props.refHeaders.rows[row].position;
            let w = this.props.refHeaders.columns.slice(column, column + width + 1).reduce((r, n) => r + n.size, 0);
            let h = this.props.refHeaders.rows.slice(row, row + height + 1).reduce((r, n) => r + n.size, 0);

            return this.props.onRenderSelection({
                key: i,
                active: false,
                edit: !!this.state.edit,
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

        let rh = this.props.refHeaders.rows[this.state.active.row];
        let ch = this.props.refHeaders.columns[this.state.active.column];

        jsx.push(this.props.onRenderSelection({
            key: ax,
            active: true,
            edit: !!this.state.edit,
            style: {
                position: 'absolute',
                zIndex: ax,
                left: ch.position,
                top: rh.position,
                width: ch.size,
                height: rh.size
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
        if (!this._refView || !this.props.refHeaders.columns.length || !this.props.refHeaders.rows.length) {
            return;
        }

        const { firstColumn, firstRow, lastColumn, lastRow } = this._lastView;
        let { column, row } = cell;

        if (row != null) {
            row = Math.min(Math.max(0, row), this._rowCount - 1);
            if (row <= firstRow || row >= lastRow) {
                let rowPos = this.props.refHeaders.rows[row].position;
                if (row <= firstRow) { // to top
                    this._refView.scrollTop = rowPos;
                } else { // to bottom
                    let rowSize = this.props.refHeaders.rows[row].size;
                    this._refView.scrollTop = rowPos + rowSize - this.state.viewHeight + this._headersHeight;
                }
            }
        }

        if (column != null) {
            column = Math.min(Math.max(0, column), this._columnCount - 1);
            if (column <= firstColumn || column >= lastColumn) {
                let colPos = this.props.refHeaders.columns[column].position;
                if (column <= firstColumn) { // to left
                    this._refView.scrollLeft = colPos;
                } else { // to right
                    let colSize = this.props.refHeaders.columns[column].size;
                    this._refView.scrollLeft = colPos + colSize - this.state.viewWidth + this._headersWidth;
                }
            }
        }
    }

    public openEditor = (cell: IGridAddress) => {
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

    public componentDidMount() {
        // this.forceUpdate();
    }

    public componentDidUpdate() {
        this._onAfterUpdate();
    }

    public componentWillUnmount() {
        this._kbCtr.dispose();
        this._msCtr.dispose();
    }

    public render() {
        const className = [
            Style.root,
            (this.props.classes && this.props.classes.main || null)
        ].filter(v => !!(v || '').trim()).join(' ');

        this._createView();
        this._createOverscan();

        const { rowsHeight, columnsWidth } = this._lastView;

        return (
            <div
                className={className}
                tabIndex={this.props.tabIndex == null ? -1 : this.props.tabIndex}
                ref={this._onRef}
                onBlur={this._onBlur}
                onFocus={this._onFocus}
                style={this.props.styles && this.props.styles.main || null}
                onKeyDown={this._onKeyDown}
                onMouseLeave={this._onRootMouseLeave}
                onMouseEnter={this._onRootMouseEnter}
            >
                <ScrollView
                    ref={this._onRefView}
                    size={this._scrollSize}
                    onUpdate={this._onScrollViewUpdate}
                    backgroundColor='rgba(0, 0, 0, 0.3)'
                    scrollerProps={this._scrollerProps}
                    afterContent={this._renderHeaderContainers}
                >
                    <div
                        ref={this._onRefScroller}
                        style={{
                            height: rowsHeight,
                            width: columnsWidth,
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
