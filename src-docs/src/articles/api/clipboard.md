# Clipboard controller
Special controller that must be used for copy-paste functionality.
Methods of this class must be provided to Grid as event handlers.

Go [here](/examples/copy-and-paste) for example.

## Constructor properties
| Property name | Required? | Description |
|:---|:---:|:---|
|`onInvalidSelection: () => void`||Called when user tries to copy selection that cannot be merged to valid table.|
|`renderCell: (e: ICopyPasteRenderCellEvent) => string`|✓|Called on copy event. Renders cell to clipboard string.|
|`renderHeader: (e: ICopyPasteRenderHeaderEvent) => string`|✓|Called on copy event. Renders header to clipboard string.|
|`clipboardParser: (data: DataTransfer) => string[][]`|✓|Called on paste event. Must get table from `DataTransfer` object. Read [this](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer) article for details about this object.|
|`cellParser: (e: ICopyPasteParseEvent) => any`|✓|Called on paste event. Returns inserting value and cell address. Useful when you show one value but store another.|
|`onCopy: (e: ICopyPasteResultEvent) => void`|✓|Called on copy event. Returns rendered table. `focus` callback used to return focus to Grid component when copying to clipboard is finished. Copy stringified table to clipboard here.|
|`onPaste: (e: ICopyPasteUpdateEvent) => void`|✓|Called on paste event. Returns parsed changes. Update Grid data here.|

## Class methods
| Method | Description |
|:---|:---|:---|
|`onCopy (event: IGridCopyEvent)`|Bound method. You must pass this method to Grid as onCopy event handler.|
|`onPaste (event: IGridPasteEvent)`|Bound method. You must pass this method to Grid as onPaste event handler.|

## Types
#### <a name="ICopyPasteRenderCellEvent"></a>
```typescript
interface ICopyPasteRenderCellEvent {
    cell: IGridAddress;
    source: any;
    repository: HeaderRepository;
}
```

#### <a name="ICopyPasteRenderHeaderEvent"></a>
```typescript
interface ICopyPasteRenderHeaderEvent {
    header: IHeader;
    type: HeaderType;
}
```

#### <a name="ICopyPasteResultEvent"></a>
```typescript
interface ICopyPasteResultEvent {
    table: any[][];
    focus: () => void;
}
```

#### <a name="ICopyPasteParseEvent"></a>
```typescript
interface ICopyPasteParseEvent {
    row: number;
    column: number;
    value: string;
}
```

#### <a name="ICopyPasteUpdateEvent"></a>
```typescript
interface ICopyPasteUpdateEvent {
    changes: {
        row: number;
        column: number;
        value: any;
    }[];
}
```