import { HeaderRepository } from './header-repository';
import { IKeyboardControllerRemoveEvent, IKeyboardControllerPasteEvent } from './keyboard-controller';
import { IScrollViewInterface } from './scroll-view';

export enum HeaderType {
    Row = 1,
    Column
}

export interface IHeader {
    /** Unique header identifier for **all** headers in repository.
     * Do not edit. Assigned by repository if not provided.
     * Can be assigned once before used. */
    $id?: number | string;
    /** List of children headers. */
    $children?: IHeader[];
    /** Size of current header. */
    $size?: number;
    /** Size of current header when collapsed. */
    $sizeCollapsed?: number;
    /** Filter flag. */
    $collapsed?: boolean;
    /** Marks this column or row read only. */
    $readOnly?: boolean;
    /** Deleting or pasting is allowed, but editor cannot be opened. */
    $noEditor?: boolean;

    /** Any other custom properties. */
    [prop: string]: any;
}

export type HeaderResizeBehavior = 'auto' | 'manual' | 'reset';
export type HeaderFilter = (props: { header: IHeader, type: HeaderType }) => boolean;
export type HeaderClampFunction = (props: { header: IHeader, type: HeaderType, size: number }) => number;

export interface IGridSelection {
    row: number;
    column: number;
    width: number;
    height: number;
}

export interface IGridAddress {
    row: number;
    column: number;
}

export interface IGridView {
    firstRow: number;
    lastRow: number;
    firstColumn: number;
    lastColumn: number;
    rowsHeight: number;
    columnsWidth: number;
}

export interface IGridOverscan {
    firstRow: number;
    lastRow: number;
    firstColumn: number;
    lastColumn: number;
}

export interface ICellRenderBaseEvent {
    row: number;
    column: number;
    rowHeader: IHeader;
    columnHeader: IHeader;
}

export interface ICellRendererEvent extends ICellRenderBaseEvent {
    active: boolean;
    style: React.CSSProperties;
    theme: IGridTheme;
    data: any;
}

export interface IHeaderMeasure {
    index: number;
    type: HeaderType;
    level: number;
    header: IHeader;
}

export interface ICellMeasureResult {
    row: number;
    column: number;
    width: number;
    height: number;
}

export interface IHeaderMeasureResult {
    header: IHeader;
    width: number;
    height: number;
}

export interface IMeasureResult {
    cells?: ICellMeasureResult[];
    headers?: IHeaderMeasureResult[];
}

export interface ICellsMeasureEvent {
    cells: ICellRenderBaseEvent[];
    headers: IHeaderMeasure[];
    data: any;
    callback: (result: IMeasureResult) => void;
}

export interface ICellEditorEvent extends ICellRendererEvent {
    /** Request to close editor. */
    close: (commit: boolean) => void;
    /** Set update for this cell. */
    update: (nextValue: any) => void;
    theme: IGridTheme;
}

export interface IResizerRenderEvent {
    type: 'level' | 'header';
    orientation: 'horizontal' | 'vertical';
    resizer: 'initial' | 'changed';
    style: React.CSSProperties;
    theme: IGridTheme;
}

export interface IHeaderRendererEvent {
    type: HeaderType;
    selection: boolean;
    style: React.CSSProperties;
    header: IHeader;
    parent: boolean;
    viewIndex: number;
    parentHeader: IHeader;
    theme: IGridTheme;
}

export interface ISelectionRendererEvent {
    key: number;
    style: React.CSSProperties;
    active: boolean;
    edit: boolean;
    theme: IGridTheme;
}

export interface IGridSpaceEvent {
    cells: IGridAddress[];
}

export interface IGridCellRightClickEvent {
    cell: IGridAddress;
    event: React.MouseEvent<HTMLElement>;
    /** Select current cell. */
    select: () => void;
    /** Right click was inside any selection. */
    inside: boolean;
}

export interface IGridHeaderRightClickEvent {
    header: IHeader;
    event: React.MouseEvent<HTMLElement>;
}

export interface IGridRemoveEvent extends IKeyboardControllerRemoveEvent { }

export interface IGridNullifyEvent extends IGridSpaceEvent { }

export interface IGridCopyEvent {
    cells: IGridAddress[];
    data: any;
    repository: HeaderRepository;
    withHeaders: boolean;
    focus: () => void;
}

export interface IGridResizeHeader {
    type: HeaderType;
    header: IHeader;
    size: number;
}

export interface IGridResizeHeaderLevel {
    type: HeaderType;
    level: number;
    size: number;
}

export interface IGridResizeCombinedEvent {
    levels?: IGridResizeHeaderLevel[];
    headers?: IGridResizeHeader[];
    behavior: HeaderResizeBehavior;
}

export interface IGridPasteEvent extends IKeyboardControllerPasteEvent {
    repository: HeaderRepository;
    data: any;
    target: IGridAddress;
}

export interface IGridUpdateEvent {
    cell: IGridAddress;
    value: any;
}

export interface IGridActiveChangeEvent {
    previous: IGridAddress;
    active: IGridAddress;
}

export interface IGridSelectionChangeEvent {
    previous: IGridSelection[];
    active: IGridSelection[];
}

export type TGridReadOnlyEventSource = 'editor' | 'paste' | 'nullify';

export interface IGridReadOnlyEvent {
    column: IHeader;
    row: IHeader;
    source: TGridReadOnlyEventSource;
}

export interface IGridTheme {
    classNameGrid?: string;
    classNameGridCorner?: string;
    classNameGridRows?: string;
    classNameGridColumns?: string;
    classNameScrollView?: string;

    styleGrid?: React.CSSProperties;
    styleGridCorner?: React.CSSProperties;
    styleGridRows?: React.CSSProperties;
    styleGridColumns?: React.CSSProperties;

    [key: string]: any;
}

export interface IGridProps {
    tabIndex?: number;

    /** Always show scrollbars. Otherwise it will be automatically hidden. */
    preserveScrollbars?: boolean;

    /** Reference to headers repository. */
    repository: HeaderRepository;

    /** Not used directly by Component, but provided to the cell renderer. */
    data?: any;

    /** Prevent editors to appear. `onNullify`, `onRemove`, `onSpace` and `onPaste` events will not be invoked. */
    readOnly?: boolean;

    overscanRows?: number;
    overscanColumns?: number;

    theme?: IGridTheme;

    active?: IGridAddress;

    selection?: IGridSelection[];

    /** Cell renderer. Required. Some event handlers will be bound. */
    onRenderCell: (e: ICellRendererEvent) => JSX.Element;

    /** Header renderer. Required. */
    onRenderHeader: (e: IHeaderRendererEvent) => JSX.Element;

    onRenderHeaderCorner?: () => JSX.Element;

    /** Selection renderer. Required. If active property is true - this renders active cell selection. */
    onRenderSelection: (e: ISelectionRendererEvent) => JSX.Element;

    /** Editor renderer. Optional. */
    onRenderEditor?: (e: ICellEditorEvent) => JSX.Element;

    /** Resizer renderer. Optional. */
    onRenderResizer?: (e: IResizerRenderEvent) => JSX.Element;

    onAutoMeasure?: (e: ICellsMeasureEvent) => void;

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
    onRightClick?: (e: IGridCellRightClickEvent) => void;

    /** Invoked on cell right click. */
    onHeaderRightClick?: (e: IGridHeaderRightClickEvent) => void;

    /** Invoked on editor close when value was changed. */
    onUpdate?: (e: IGridUpdateEvent) => void;

    /** Invoked when active cell changed. */
    onActiveChanged?: (e: IGridActiveChangeEvent) => void;

    /** Invoked when selection changed. */
    onSelectionChanged?: (e: IGridSelectionChangeEvent) => void;

    /** Called when header set was resized. */
    onHeaderResize?: (e: IGridResizeCombinedEvent) => void;

    /** Checks if current cell is readonly. Pasting and editing of that cell will be forbidden. */
    onReadOnly?: (e: IGridReadOnlyEvent) => boolean;

    /** Hidded property, sometime I will document it. (ಠ_ಠ) Not supposed to be used for now. */
    scrollViewClass?: IScrollViewInterface;
}
