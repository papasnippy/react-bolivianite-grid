# Headers container
Immutable header container. Can be used in Redux store. Contains all headers, it's sizes, positions, filter condition etc.
Because of immutable nature can be easily used for undo-redo. See [this](/examples/editable) example for details.

All headers **must** implement [IHeader](#IHeader) interface.
Important note about `$id` property - this is an unique header identifier for all headers in container.
If it is undefined - it will be set by `HeaderContainer` as mutable operation. This is the only mutable operation.

When it is possible to use just view row and column indices to identify cells in grid, it is strongly
recommended to use custom idenfiers in headers for that, like `header.rowIndex` and `header.columnIndex`.

## Prop types

| Property name | Type | Required? | Description |
|:---|:---|:---:|:---|
|rows|[IHeader](#IHeader)|✓|Row headers.|
|columns|[IHeader](#IHeader)|✓|Columns headers.|
|columnWidth|number|✓|Default column width.|
|rowHeight|number|✓|Default row height.|
|headersHeight|number|✓|Default height of column headers.|
|headersWidth|number|✓|Default width of row headers.|
|filter|[HeaderContainerFilter](#HeaderContainerFilter)||Headers filter (both rows and columns).|

## Getters
| Property name | Type | Description |
|:---|:---|:---|
|columns|[IHeader[]](#IHeader)|Array of [IHeader](#IHeader). Leaves of header tree. Array index equals view index.|
|rows|[IHeader[]](#IHeader)|Array of [IHeader](#IHeader). Leaves of header tree. Array index equals view index.|

## Class methods
| Method | Description |
|:---|:---|:---|
|`getHeader(id: number | string): IHeader`|Return [IHeader](#IHeader) by $id.|
|`getHeaderType(h: IHeader): HeaderType`|Return header's [HeaderType](#HeaderType).|
|`getViewIndex(h: IHeader): number`|Return header's view index (row for row header and column for column header).|
|`getSize(h: IHeader): number`|Return header's size depending by it's `$collapsed property`.|
|`getPosition(h: IHeader): number`|Return header's position in `px`.|
|`getLevel(h: IHeader): number`|Return header's level. Needs for grouped headers.|
|`getParent(h: IHeader): IHeader`|Return header's parent.|
|`getHeaderLeaves(h: IHeader): IHeader[]`|Return list of header's leaves.|
|`updateFilter(filter: HeaderContainerFilter): HeadersContainer`|Return new immutable header container with filtered headers.|
|`updateHeaders(updates): HeadersContainer`|Go [here](#updateHeaders) for details.|
|`resizeHeaders(props): HeadersContainer`|Go [here](#resizeHeaders) for details.|

## Class methods details
#### <a name="updateHeaders"></a> updateHeaders
```typescript
updateHeaders(
    updates: {
        header: IHeader;
        update: IHeader;
    }[]
): HeadersContainer
```
Update headers. Use query array to define `header` that's must be updated and new `update` state for it.
Return new immutable header container with updated headers.

#### <a name="resizeHeaders"></a> resizeHeaders
```typescript
resizeHeaders(
    props: {
        list: {
            header: IHeader;
            size: number;
        }[];
        clamp?: HeaderClampFunction;
        behavior?: HeaderResizeBehavior;
    }
): HeadersContainer
```
Return new immutable header container with resized headers.
- `list` property must contain array of [IHeader](#IHeader) that needs to be resized.
- Optional [HeaderClampFunction](#HeaderClampFunction) used to limit header new size.
- Optional [HeaderResizeBehavior](#HeaderResizeBehavior) defines how header will be resized. This affects autosizing behavior.

## Types
#### <a name="HeaderType"></a>
```typescript
enum HeaderType {
    Row = 1,
    Column
}
```

#### <a name="HeaderResizeBehavior"></a>
```typescript
type HeaderResizeBehavior = 'auto' | 'manual' | 'reset';
```

#### <a name="HeaderContainerFilter"></a>
```typescript
type HeaderContainerFilter = (props: { header: IHeader, type: HeaderType }) => boolean;
```

#### <a name="HeaderClampFunction"></a>
```typescript
type HeaderClampFunction = (props: { header: IHeader, type: HeaderType, size: number }) => number;
```

#### <a name="IHeader"></a>
```typescript
interface IHeader {
    /** Unique header identifier for **all** headers in container.
     * Do not edit. Assigned by header container if not provided.
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

    /** Any other custom properties. */
    [prop: string]: any;
}
```