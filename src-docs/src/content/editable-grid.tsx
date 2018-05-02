import * as React from 'react';
import Grid, {
    HeaderType, ICellRendererEvent, IHeaderRendererEvent, ISelectionRendererEvent,
    ICellEditorEvent, IGridNullifyEvent, IGridUpdateEvent
} from 'react-bolivianite-grid';
import BaseExample from './base-example';
import Editor from './simple-editor';
import Theme from './style';

export class EditableGridExample extends BaseExample {
    renderCellValue(columnIndex: number, rowIndex: number, source: any) {
        const key = `${rowIndex} x ${columnIndex}`;
        return source[key] === void 0 ? key : source[key];
    }

    renderCell = ({ style, column, row, source, theme }: ICellRendererEvent) => {
        return (
            <div
                style={{
                    ...style,
                    ...theme.cellStyle,
                    background: row % 2 ? theme.cellBackgroundEven : theme.cellBackgroundOdd
                }}
            >
                {this.renderCellValue(column, row, source )}
            </div>
        );
    }

    renderHeader = ({ style, type, selection, viewIndex, theme, header }: IHeaderRendererEvent) => {
        const nextStyle: React.CSSProperties = {
            ...style,
            ...theme.headerStyle
        };

        switch (type) {
            case HeaderType.Row:
                nextStyle.borderBottomColor = theme.headerBorderColor;
                break;

            case HeaderType.Column:
                nextStyle.borderRightColor = theme.headerBorderColor;
                break;
        }

        if (selection) {
            nextStyle.background = theme.headerBackgroundColorSelected;
        }

        nextStyle.justifyContent = type === HeaderType.Row ? 'flex-end' : 'center';

        return (
            <div style={nextStyle}>
                {
                    header.caption || (
                        type === HeaderType.Column && viewIndex != null
                            ? this.excelIndex(viewIndex)
                            : viewIndex
                    )
                }
            </div>
        );
    }

    renderSelection = ({ key, style, active, edit, theme }: ISelectionRendererEvent) => {
        style.left = Number(style.left) - 1;
        style.top = Number(style.top) - 1;
        style.width = Number(style.width) + 1;
        style.height = Number(style.height) + 1;

        return (
            <div
                key={key}
                style={{
                    ...style,
                    boxSizing: 'border-box',
                    backgroundColor: (active || edit) ? theme.selectionBackgroundActive : theme.selectionBackground,
                    border: active ? theme.selectionBorderActive : theme.selectionBorder
                }}
            />
        );
    }

    editorRenderer = ({ style, column, row, update, source, theme }: ICellEditorEvent) => {
        let initialValue = this.renderCellValue(column, row, source);

        return (
            <div
                style={{
                    ...style,
                    boxSizing: 'border-box',
                    borderRight: `solid 1px ${theme.editorBorderColor}`,
                    borderBottom: `solid 1px ${theme.editorBorderColor}`,
                    padding: '0 3px',
                    display: 'flex',
                    alignItems: 'center',
                    background: theme.editorBackground
                }}
            >
                <Editor
                    initialValue={initialValue}
                    update={update}
                />
            </div>
        );
    }

    onNullify = ({ cells }: IGridNullifyEvent) => {
        let data = {
            ...this.currentState.data
        };

        cells.forEach(({ column, row }) => {
            data[`${row} x ${column}`] = null;
        });

        this.pushHistory({ data });
    }

    onUpdate = ({ cell, value }: IGridUpdateEvent) => {
        let { column, row } = cell;
        let key = `${row} x ${column}`;

        this.pushHistory({
            data: {
                ...this.currentState.data,
                [key]: value
            }
        });
    }

    renderGrid() {
        const { data, headers } = this.currentState;
        return (
            <Grid
                headers={headers}
                overscanRows={3}
                source={data}
                theme={Theme}
                onRenderCell={this.renderCell}
                onRenderHeader={this.renderHeader}
                onRenderSelection={this.renderSelection}
                onRenderEditor={this.editorRenderer}
                onNullify={this.onNullify}
                onUpdate={this.onUpdate}
            />
        );
    }
}

export default EditableGridExample;
