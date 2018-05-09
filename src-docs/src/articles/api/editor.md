# Editor component

Editor is a special component that rendered instead of cell.
Editors rendered by special renderer-prop, which has this interface:
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
    close: (commit: boolean) => void;
    update: (nextValue: any) => void;
}

onRenderEditor(event: ICellEditorEvent) => JSX.Element;
```

There are two main callback provided in this event:
- `update` Editor must update value with this callback. However, grid will not update data source
at this time. It will just mark that this cell was updated by editor. User can discard editing
with `ESC` key and updated value will be ignored. Editor can call this callback at any time.
- `close` Usually Grid handles closing editors by listening `ESC`, `ENTER`, `TAB` and other keys.
However, if binding to this keys were reimplemented or when editor stops propagation for this events
you may need to close editor manually. You can close editor and tell Grid to ignore updated value or
apply it (commit=true).

Using editor example:
```typescript
import Editor from './simple-editor';

// ...

<Grid
    // ...
    onRenderEditor={({ style, column, row, update, source }) => {
        const initialValue = this.renderCellValue(column, row, source);

        return (
            <div style={style}>
                <Editor initialValue={initialValue} update={update} />
            </div>
        );
    }}
/>
```

You can see full example [here](/examples/editable). This is an example of simple text editor:

```app.file
{
    "file": "simple-editor.tsx",
    "language": "typescript"
}
```