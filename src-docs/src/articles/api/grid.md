# Grid component

Grid is a low level React component that provides ability to show and position table data.
It doesn't implement full Excel-like spreadsheet features, but provides some api.

Core feature of this component is to virtualize table data, show it and it's related headers.
Component contains some keyboard shortcuts for navigating, editing and copy-pasting cells.
However, component do not copy-paste data itself, but provides api for that.

Component does not contain any theme but implements position-only inline styles.
You can provide your custom css classnames and inline styles for every component of the Grid.

Component by default has `width: 100%, height: 100%` style, so you can put Grid inside fixed size component
or provide class name or css style.

Grid does not support infinity scrolling. At least for now.

## Prop types
| Property name | Type | Required? | Description |
|:---|:---|:---:|:---|
|tabIndex|number||Root component tab index attribute. Default = -1.|
|headers|[HeaderRepository](/api/headers)|✓|Read [this](/api/headers) article for details.|
|source|any||Data source. Not used directly, only passed to all other grid properties. Can be any type.|
|readOnly|boolean||Sets grid to readonly mode.|
|overscanRows<br>overscanColumns|number||Grid renders only exact amount of row and columns that fits into viewport by default. This setting can expand this range.|
|theme|[IGridTheme](#IGridTheme)||Grid theme. Used to define classnames and styles for grid parts, also provided to header and cell renderers.|


## Prop handlers
All prop handlers implements this interface:
```typescript
onName(e: EventType) => (JSX.Element | void)
```
#### Renderers
Every callback must return `JSX.Element` type.

| Property name | Event type | Required? | Description |
|:---|:---|:---:|:---|
|onRenderCell|[ICellRendererEvent](#ICellRendererEvent)|✓|Cell renderer.|
|onRenderHeader|[IHeaderRendererEvent](#IHeaderRendererEvent)|✓|Header renderer.|
|onRenderSelection|[ISelectionRendererEvent](#ISelectionRendererEvent)|✓|Cell selections renderer. [Example](/examples/resizing).|
|onRenderEditor|[ICellEditorEvent](#ICellEditorEvent)||Editor renderer. See [this](/api/editor) article for details.|
|onRenderResizer|[IResizerRenderEvent](#IResizerRenderEvent)||Resizer renderer. [Example](/examples/resizing).|

#### Other
All other callbacks. They all optional.

| Property name | Event type | Description |
|:---|:---|:---|:---|
|onAutoMeasure|[ICellsMeasureEvent](#ICellsMeasureEvent)|Auto measure callback. Read [this](/examples/autosizing) article for details.|
|onSpace|[IGridSpaceEvent](#IGridSpaceEvent)|Called when space bar is pressed. Useful to manage cells with boolean type.|
|onRemove|[IGridRemoveEvent](#IGridRemoveEvent)|Called when `CMD`+`DELETE` is pressed. Remove records here.|
|onNullify|[IGridNullifyEvent](#IGridNullifyEvent)|Called when just `DELETE` is pressed. Remove cell values here.|
|onCopy|[IGridCopyEvent](#IGridCopyEvent)|Callback used for copying cells. Read [copy-paste](/examples/clipboard) artice for details. |
|onPaste|[IGridPasteEvent](#IGridPasteEvent)|Callback used for pasting cells. Read [copy-paste](/examples/clipboard) artice for details. |
|onRightClick|[IGridCellRightClickEvent](#IGridCellRightClickEvent)|Called when right click pressed on any cell.|
|onHeaderRightClick|[IGridHeaderRightClickEvent](#IGridHeaderRightClickEvent)|Called when right click pressed on any header.|
|onUpdate|[IGridUpdateEvent](#IGridUpdateEvent)|Called when any changes was commited. Update data source here.|
|onActiveChanged|[IGridActiveChangeEvent](#IGridActiveChangeEvent)|Called when active cell is changed.|
|onSelectionChanged|[IGridSelectionChangeEvent](#IGridSelectionChangeEvent)|Called when selection is changed.|
|onHeaderResize|[IGridResizeCombinedEvent](#IGridResizeCombinedEvent)|Called when headers were resized by autosize event or manually.|

## Class methods
| Method | Description |
|:---|:---|:---|
|`scrollTo(cell: { column?: number, row?: number })`|Scroll to specific column, row or cell.|
|`openEditor(cell: { column? number, row: number })`|Opens editor in this cell.|
|`closeEditor(commit: boolean, callback?: () => void)`|Close opened editor.<br>- `commit` parameter defines if updated value must be commited to data source.<br>- optional `callback` called after editor is closed and grid rendered with new state.|

## Types

#### <a name="IGridAddress"></a>
```typescript
interface IGridAddress {
    row: number;
    column: number;
}
```

#### <a name="IGridSelection"></a>
```typescript
interface IGridSelection {
    row: number;
    column: number;
    width: number;
    height: number;
}
```

#### <a name="IGridTheme"></a>
```typescript
interface IGridTheme {
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
```

#### <a name="ICellRendererEvent"></a>
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

#### <a name="IHeaderRendererEvent"></a>
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

#### <a name="ISelectionRendererEvent"></a>
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

#### <a name="ICellEditorEvent"></a>
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

#### <a name="IResizerRenderEvent"></a>
```typescript
interface IResizerRenderEvent {
    type: 'level' | 'header';
    orientation: 'horizontal' | 'vertical';
    resizer: 'initial' | 'changed';
    style: React.CSSProperties;
    theme: IGridTheme;
}
```

#### <a name="ICellsMeasureEvent"></a>
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

#### <a name="IGridSpaceEvent"></a>
```typescript
interface IGridSpaceEvent {
    cells: IGridAddress[];
}
```

#### <a name="IGridRemoveEvent"></a>
```typescript
interface IGridRemoveEvent {
    rows: number[];
    columns: number[];
}
```

#### <a name="IGridNullifyEvent"></a>
```typescript
interface IGridNullifyEvent {
    cells: IGridAddress[];
}
```

#### <a name="IGridCopyEvent"></a>
```typescript
interface IGridCopyEvent {
    cells: IGridAddress[];
    source: any;
    headers: HeaderRepository;
    // This flag shows, that cells must be copied with headers
    withHeaders: boolean;
    // Focus grid callback
    focus: () => void;
}
```

#### <a name="IGridPasteEvent"></a>
```typescript
interface IGridPasteEvent {
    headers: HeaderRepository;
    source: any;
    target: IGridAddress;
}
```

#### <a name="IGridCellRightClickEvent"></a>
```typescript
interface IGridCellRightClickEvent {
    cell: IGridAddress;
    event: React.MouseEvent<HTMLElement>;
}
```

#### <a name="IGridHeaderRightClickEvent"></a>
```typescript
interface IGridHeaderRightClickEvent {
    header: IHeader;
    event: React.MouseEvent<HTMLElement>;
}
```

#### <a name="IGridUpdateEvent"></a>
```typescript
interface IGridUpdateEvent {
    cell: IGridAddress;
    value: any;
}
```

#### <a name="IGridActiveChangeEvent"></a>
```typescript
interface IGridActiveChangeEvent {
    previous: IGridAddress;
    active: IGridAddress;
}
```

#### <a name="IGridSelectionChangeEvent"></a>
```typescript
interface IGridSelectionChangeEvent {
    previous: IGridSelection[];
    active: IGridSelection[];
}
```

#### <a name="IGridResizeCombinedEvent"></a>
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