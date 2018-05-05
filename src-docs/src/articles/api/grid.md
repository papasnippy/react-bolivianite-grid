## Grid component api

### Prop types
| Property | Type | Required? | Description |
|:---|:---|:---:|:---|
|tabIndex|number||Root component tab index attribute. Default = -1.|
|headers|[HeadersContainer](headers-container)|✓|Headers container object. Contains all headers and it's state. Read [this](headers-container) for details.|
|source|any||Data source. Not used directly, only passed to all other grid properties. Can be any type.|
|readOnly|boolean||Sets grid to readonly mode.|
|overscanRows<br>overscanColumns|number||By default grid renders only exact amount of row and columns that fits into viewport. This setting can expand this range.|
|theme|[IGridTheme](#IGridTheme)||Grid theme. Used to define classnames and styles for grid parts, also provided to header and cell renderers.|
|scrollViewClass|[IScrollViewInterface](#IScrollViewInterface)||Custom scroll view component class. Read [this](custom-scroll-view) article for details.|

### Prop handlers
All prop handlers implements this interface:
```typescript
propertyName(event: EventType) => (JSX.Element | void)
```
#### Renderers
Every callback must return `JSX.Element` type.

| Property | Event type | Required? | Description |
|:---|:---|:---:|:---|
|onRenderCell|[ICellRendererEvent](#ICellRendererEvent)|✓|Cell renderer.|
|onRenderHeader|[IHeaderRendererEvent](#IHeaderRendererEvent)|✓|Header renderer.|
|onRenderSelection|[ISelectionRendererEvent](#ISelectionRendererEvent)|✓|Selection renderer.|
|onRenderEditor|[ICellEditorEvent](#ICellEditorEvent)||Editor renderer. See [this](editors) article for details.|
|onRenderResizer|[IResizerRenderEvent](#IResizerRenderEvent)||Resizer renderer.|

#### Other
All other callbacks. They all optional.

| Property | Event type | Description |
|:---|:---|:---|:---|
|onAutoMeasure|[ICellsMeasureEvent](#ICellsMeasureEvent)|Auto measure callback. Read [this](auto-measuring) article for details.|
|onSpace|[IGridSpaceEvent](#IGridSpaceEvent)|Called when space bar is pressed. Useful to manage cells with boolean type.|
|onRemove|[IGridRemoveEvent](#IGridRemoveEvent)|Called when `CMD`+`DELETE` is pressed. Remove records here.|
|onNullify|[IGridNullifyEvent](#IGridNullifyEvent)|Called when just `DELETE` is pressed. Remove cell values here.|
|onCopy|[IGridCopyEvent](#IGridCopyEvent)|Callback used for copying cells. Read [copy-paste](copy-paste) artice for details. |
|onPaste|[IGridPasteEvent](#IGridPasteEvent)|Callback used for pasting cells. Read [copy-paste](copy-paste) artice for details. |
|onRightClick|[IGridCellRightClickEvent](#IGridCellRightClickEvent)|Called when right click pressed on any cell.|
|onHeaderRightClick|[IGridHeaderRightClickEvent](#IGridHeaderRightClickEvent)|Called when right click pressed on any header.|
|onUpdate|[IGridUpdateEvent](#IGridUpdateEvent)|Called when any changes was commited. Update data source here.|
|onActiveChanged|[IGridActiveChangeEvent](#IGridActiveChangeEvent)|Called when active cell is changed.|
|onSelectionChanged|[IGridSelectionChangeEvent](#IGridSelectionChangeEvent)|Called when selection is changed.|
|onHeaderResize|[IGridResizeCombinedEvent](#IGridResizeCombinedEvent)|Called when headers were resized by autosize event or manually.|

### Class methods
| Method | Description |
|:---|:---|:---|
|`scrollTo(cell: { column?: number, row?: number })`|Scroll to specific column, row or cell.|
|`openEditor(cell: { column? number, row: number })`|Opens editor in this cell.|
|`closeEditor(commit: boolean, callback?: () => void)`|Close opened editor.<br>- `commit` parameter defines if updated value must be commited to data source.<br>- optional `callback` called after editor is closed and grid rendered with new state.|

### Types

#### <a name="IGridAddress"></a> IGridAddress
```typescript
interface IGridAddress {
    row: number;
    column: number;
}
```

#### <a name="IGridSelection"></a> IGridSelection
```typescript
interface IGridSelection {
    row: number;
    column: number;
    width: number;
    height: number;
}
```

#### <a name="IGridTheme"></a> IGridTheme
```typescript
interface IGridTheme {
    classNameGrid?: string;
    classNameGridCorner?: string;
    classNameGridRows?: string;
    classNameGridColumns?: string;
    classNameScroller?: string;
    classNameScrollerContainer?: string;

    styleGrid?: React.CSSProperties;
    styleGridCorner?: React.CSSProperties;
    styleGridRows?: React.CSSProperties;
    styleGridColumns?: React.CSSProperties;
    styleScroller?: React.CSSProperties;

    [key: string]: any;
}
```

#### <a name="IScrollViewInterface"></a> IScrollViewInterface
```typescript
interface IScrollViewProps extends IScrollViewThemingProps {
    scrollerContainerProps?: React.HTMLProps<HTMLDivElement>;
    onScroll: (event: IScrollViewUpdateEvent) => void;
    bodyRenderer: (event: IScrollViewUpdateEvent) => React.ReactNode;
    headersRenderer: (event: IScrollViewUpdateEvent) => React.ReactNode;
}

interface IScrollViewComponentInterface extends React.Component<IScrollViewProps, any> {
    scrollerStyle: CSSStyleDeclaration; // get
    scrollLeft: number; // get, set
    scrollTop: number; // get, set
}

interface IScrollViewInterface extends React.StaticLifecycle<IScrollViewProps, any> {
    new (props: IScrollViewProps, context?: any): IScrollViewComponentInterface;
    propTypes?: React.ValidationMap<IScrollViewProps>;
    contextTypes?: React.ValidationMap<any>;
    childContextTypes?: React.ValidationMap<any>;
    defaultProps?: Partial<IScrollViewProps>;
    displayName?: string;
}
```

#### <a name="ICellRendererEvent"></a> ICellRendererEvent
```typescript
interface ICellRendererEvent {
    // view row index
    row: number;
    // view column index
    column: number;
    // row header object
    rowHeader: IHeader;
    // column header object
    columnHeader: IHeader;
    // data source
    source: any;
    // active cell flag
    active: boolean;
    // positioning style, must be applied to rendering element
    style: React.CSSProperties;
    // grid theme object
    theme: IGridTheme;
}
```

#### <a name="IHeaderRendererEvent"></a> IHeaderRendererEvent
```typescript
interface IHeaderRendererEvent {
    // header type (HeaderType.Row or HeaderType.Column)
    type: HeaderType;
    // cell in selection flag
    selection: boolean;
    // positioning style, must be applied to rendering element
    style: React.CSSProperties;
    // current header object
    header: IHeader;
    // this header is parent header flag
    parent: boolean;
    // view index (row or column, -1 if parent)
    viewIndex: number;
    // parent header object
    parentHeader: IHeader;
    // grid theme object
    theme: IGridTheme;
}
```

#### <a name="ISelectionRendererEvent"></a> ISelectionRendererEvent
```typescript
interface ISelectionRendererEvent {
    // JSX key attribute, must be applied to rendering element
    key: number;
    // positioning style, must be applied to rendering element
    style: React.CSSProperties;
    // active cell selection flag, usually this is selection with border and no background
    active: boolean;
    // grid in edit mode flag, don't apply selection background if `true`
    edit: boolean;
    // grid theme object
    theme: IGridTheme;
}
```

#### <a name="ICellEditorEvent"></a> ICellEditorEvent
```typescript
interface ICellEditorEvent {
    row: number;
    column: number;
    rowHeader: IHeader;
    columnHeader: IHeader;
    source: any;
    active: boolean;
    style: React.CSSProperties;
    theme: IGridTheme;
    // called by rendered editor when grid should close editor
    close: (commit: boolean) => void;
    // called by rendered editor when grid should update value
    update: (nextValue: any) => void;
}
```

#### <a name="IResizerRenderEvent"></a> IResizerRenderEvent
```typescript
interface IResizerRenderEvent {
    type: 'level' | 'header';
    orientation: 'horizontal' | 'vertical';
    resizer: 'initial' | 'changed';
    style: React.CSSProperties;
    theme: IGridTheme;
}
```

#### <a name="ICellsMeasureEvent"></a> ICellsMeasureEvent
```typescript
interface ICellRenderBaseEvent {
    row: number;
    column: number;
    rowHeader: IHeader;
    columnHeader: IHeader;
    source: any;
}

interface IHeaderMeasure {
    index: number;
    type: HeaderType;
    level: number;
    header: IHeader;
    source: any;
}

interface ICellMeasureResult {
    row: number;
    column: number;
    width: number;
    height: number;
}

interface IHeaderMeasureResult {
    header: IHeader;
    width: number;
    height: number;
}

interface IMeasureResult {
    cells?: ICellMeasureResult[];
    headers?: IHeaderMeasureResult[];
}

interface ICellsMeasureEvent {
    cells: ICellRenderBaseEvent[];
    headers: IHeaderMeasure[];
    callback: (result: IMeasureResult) => void;
}
```

#### <a name="IGridSpaceEvent"></a> IGridSpaceEvent
```typescript
interface IGridSpaceEvent {
    cells: IGridAddress[];
}
```

#### <a name="IGridRemoveEvent"></a> IGridRemoveEvent
```typescript
interface IGridRemoveEvent {
    rows: number[];
    columns: number[];
}
```

#### <a name="IGridNullifyEvent"></a> IGridNullifyEvent
```typescript
interface IGridNullifyEvent {
    cells: IGridAddress[];
}
```

#### <a name="IGridCopyEvent"></a> IGridCopyEvent
```typescript
interface IGridCopyEvent {
    cells: IGridAddress[];
    source: any;
    headers: HeadersContainer;
    // This flag shows, that cells must be copied with headers
    withHeaders: boolean;
    // Focus grid callback
    focus: () => void;
}
```

#### <a name="IGridPasteEvent"></a> IGridPasteEvent
```typescript
interface IGridPasteEvent {
    headers: HeadersContainer;
    source: any;
    target: IGridAddress;
}
```

#### <a name="IGridCellRightClickEvent"></a> IGridCellRightClickEvent
```typescript
interface IGridCellRightClickEvent {
    cell: IGridAddress;
    event: React.MouseEvent<HTMLElement>;
}
```

#### <a name="IGridHeaderRightClickEvent"></a> IGridHeaderRightClickEvent
```typescript
interface IGridHeaderRightClickEvent {
    header: IHeader;
    event: React.MouseEvent<HTMLElement>;
}
```

#### <a name="IGridUpdateEvent"></a> IGridUpdateEvent
```typescript
interface IGridUpdateEvent {
    cell: IGridAddress;
    value: any;
}
```

#### <a name="IGridActiveChangeEvent"></a> IGridActiveChangeEvent
```typescript
interface IGridActiveChangeEvent {
    previous: IGridAddress;
    active: IGridAddress;
}
```

#### <a name="IGridSelectionChangeEvent"></a> IGridSelectionChangeEvent
```typescript
interface IGridSelectionChangeEvent {
    previous: IGridSelection[];
    active: IGridSelection[];
}
```

#### <a name="IGridResizeCombinedEvent"></a> IGridResizeCombinedEvent
```typescript
interface IGridResizeHeaderLevel {
    type: HeaderType;
    level: number;
    size: number;
}

interface IGridResizeHeader {
    type: HeaderType;
    header: IHeader;
    size: number;
}

interface IGridResizeCombinedEvent {
    levels?: IGridResizeHeaderLevel[];
    headers?: IGridResizeHeader[];
    behavior: 'auto' | 'manual' | 'reset';
}
```