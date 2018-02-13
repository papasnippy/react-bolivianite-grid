import { IGridAddress, HeaderType } from '../types';
import { IHeader, HeaderResizeBehavior, HeadersContainer } from '../models';
import { IKeyboardControllerRemoveEvent, IKeyboardControllerPasteEvent } from '../controllers';
import { IScrollViewThemeStyles, IScrollViewThemeClassNames, IScrollViewTheme } from './scrollview';

export interface ICellRenderBaseEvent {
    rowIndex: number;
    columnIndex: number;
    rowHeader: IHeader;
    columnHeader: IHeader;
    source: any;
}

export interface ICellRendererEvent extends ICellRenderBaseEvent {
    active: boolean;
    style: React.CSSProperties;
}

export interface ICellsMeasureEvent {
    cells: ICellRenderBaseEvent[];
    callback: (result: ICellMeasureResult[]) => void;
}

export interface ICellMeasureResult {
    rowIndex: number;
    columnIndex: number;
    width: number;
    height: number;
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
    headers: {
        type: HeaderType;
        header: IHeader;
        size: number;
    }[];
    behavior: HeaderResizeBehavior;
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

export interface IGridThemeClassNames extends IScrollViewThemeClassNames {
    grid?: string;
    gridCorner?: string;
    rows?: string;
    columns?: string;
}

export interface IGridThemeStyles extends IScrollViewThemeStyles {
    grid?: React.CSSProperties;
    gridCorner?: React.CSSProperties;
    rows?: React.CSSProperties;
    columns?: React.CSSProperties;
}

export interface IGridTheme extends IScrollViewTheme {
    classNames?: IGridThemeClassNames;
    styles?: IGridThemeStyles;
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

    theme?: IGridTheme;

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
    onRightClick?: (e: IGridAddress) => void;

    /** Invoked on cell right click. */
    onHeaderRightClick?: (e: IGridHeaderRightClickEvent) => void;

    /** Invoked on editor close when value was changed. */
    onUpdate?: (e: IGridUpdateEvent) => void;

    onHeaderResize?: (e: IGridResizeHeadersEvent) => void;

    onHeaderLevelResize?: (e: IGridResizeHeaderLevelEvent) => void;
}
