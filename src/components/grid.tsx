import * as React from 'react';
import * as PropTypes from 'prop-types';
import ScrollView, { IScrollViewUpdateEvent } from './scrollview';
import {
    debounce, Shallow, RenderThrottler, KeyboardController,
    IUpdateSelectionEvent, IKeyboardControllerRemoveEvent,
    MouseController, IKeyboardControllerPasteEvent
} from '../controllers';
import {
    IGridAddress, IGridSelection, IGridView, IGridOverscan, HeaderType
} from '../types';
import {
    HeadersContainer, IHeader
} from '../models';

const Style = require('./grid.scss');

//#region interfaces
export interface ICellRendererEvent {
    rowIndex: number;
    columnIndex: number;
    active: boolean;
    style: React.CSSProperties;
    source: any;
    rowHeader: IHeader;
    columnHeader: IHeader;
}

export interface ICellEditorEvent extends ICellRendererEvent {
    /** Request to close editor. */
    close: (commit: boolean) => void;
    /** Set update for this cell. */
    update: (nextValue: any) => void;
}

export interface IResizerRenderEvent {
    type: 'level' | 'header';
    orientation: 'horizontal' | 'vertical';
    resizer: 'initial' | 'changed';
    style: React.CSSProperties;
}

export interface IHeaderRendererEvent {
    type: HeaderType;
    selection: boolean;
    style: React.CSSProperties;
    header: IHeader;
    parent: boolean;
    viewIndex: number;
    parentHeader: IHeader;
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

export interface IGridHeaderRightClickEvent {
    header: IHeader;
    event: React.MouseEvent<HTMLElement>;
}

export interface IGridRemoveEvent extends IKeyboardControllerRemoveEvent { }

export interface IGridNullifyEvent extends IGridSpaceEvent { }

export interface IGridCopyEvent {
    cells: IGridAddress[];
    withHeaders: boolean;
}

export interface IGridResizeHeadersEvent {
    type: HeaderType;
    header: IHeader;
    size: number;
}

export interface IGridResizeHeaderLevelEvent {
    type: HeaderType;
    level: number;
    size: number;
}

export interface IGridPasteEvent extends IKeyboardControllerPasteEvent {
    target: IGridAddress;
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
    headers: HeadersContainer;

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

    /** Resizer renderer. Optional. */
    onRenderResizer?: (e: IResizerRenderEvent) => JSX.Element;

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

    /** Invoked on cell right click. */
    onHeaderRightClick?: (e: IGridHeaderRightClickEvent) => void;

    /** Invoked on editor close when value was changed. */
    onUpdate?: (e: IGridUpdateEvent) => void;

    onHeaderResize?: (e: IGridResizeHeadersEvent) => void;

    onHeaderLevelResize?: (e: IGridResizeHeaderLevelEvent) => void;
}
//#endregion

export class Grid extends React.PureComponent<IGridProps, any> {
    static childContextTypes = {
        grid: PropTypes.object,
        headers: PropTypes.object
    };

    getChildContext() {
        return {
            grid: this,
            headers: this.props.headers
        };
    }

    private _shallow = {
        colHeaders: Shallow<React.CSSProperties>(),
        rowHeaders: Shallow<React.CSSProperties>(),
        crnHeaders: Shallow<React.CSSProperties>()
    };

    private _blockContextMenu = false;
    private _onContextMenuListener: any = null;
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

        for (let ch of this.props.headers.columns) {
            if (firstColumn === -1 && columnsWidth >= sl - ch.$size) {
                firstColumn = colIndex;
            }

            columnsWidth += ch.$size;

            if (lastColumn === -1 && columnsWidth >= sl + vw + this._scrollSize) {
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
                    {this.props.onRenderResizer({ type, orientation, style: styleInitial, resizer: 'initial' })}
                    {this.props.onRenderResizer({ type, orientation, style: styleChanged, resizer: 'changed' })}
                </>
            );
        }

        return null;
    }

    private _renderHeaderContainers = (event: IScrollViewUpdateEvent) => {
        const { clientWidth, clientHeight, scrollLeft, scrollTop } = event;
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
                {!!this.props.headers.headersHeight &&
                    <div
                        className={cnColumns}
                        style={this._shallow.colHeaders({
                            ...(this.props.styles && this.props.styles.columns || {}),
                            left: this.props.headers.headersWidth,
                            top: 0,
                            right: 0,
                            height: this.props.headers.headersHeight
                        })}
                    >
                        {this._renderHeaders(HeaderType.Column, scrollLeft)}
                    </div>
                }
                {!!this.props.headers.headersWidth &&
                    <div
                        className={cnRows}
                        style={this._shallow.rowHeaders({
                            ...(this.props.styles && this.props.styles.rows || {}),
                            left: 0,
                            top: this.props.headers.headersHeight,
                            bottom: 0,
                            width: this.props.headers.headersWidth
                        })}
                    >
                        {this._renderHeaders(HeaderType.Row, scrollTop)}
                    </div>
                }
                {!!(this.props.headers.headersHeight || this.props.headers.headersWidth) &&
                    <div
                        className={cnCorner}
                        style={this._shallow.crnHeaders({
                            ...(this.props.styles && this.props.styles.corner || {}),
                            left: 0,
                            top: 0,
                            height: this.props.headers.headersHeight,
                            width: this.props.headers.headersWidth
                        })}
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

    public resizeHeader(e: IGridResizeHeadersEvent) {
        if (this.props.onHeaderResize) {
            this.props.onHeaderResize(e);
        }
    }

    public resizeLevel(e: IGridResizeHeaderLevelEvent) {
        if (this.props.onHeaderLevelResize) {
            this.props.onHeaderLevelResize(e);
        }
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

    public componentDidUpdate() {
        this._onAfterUpdate();
    }

    public componentWillUnmount() {
        document.body.removeEventListener('contextmenu', this._onContextMenuListener);
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
                onMouseDown={this._onRootMouseDown}
            >
                <ScrollView
                    ref={this._onRefView}
                    size={this._scrollSize}
                    onUpdate={this._onScrollViewUpdate}
                    backgroundColor="rgba(0, 0, 0, 0.3)"
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
