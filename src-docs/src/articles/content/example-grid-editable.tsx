import * as React from 'react';
import Grid, {
    HeaderType, ICellRendererEvent, IHeaderRendererEvent, ISelectionRendererEvent,
    ICellEditorEvent, IGridNullifyEvent, IGridUpdateEvent
} from 'react-bolivianite-grid';
import BaseExample from './base-example';
import Editor from './simple-editor';
import Theme from './style';

export class EditableGridExample extends BaseExample {
    renderCell = ({ style, columnIndex, rowIndex, source, theme }: ICellRendererEvent) => {
        const key = `${rowIndex} x ${columnIndex}`;
        const display = source[key] === void 0 ? key : source[key];
        return (
            <div
                style={{
                    ...style,
                    ...theme.cellStyle,
                    background: rowIndex % 2 ? theme.cellBackgroundEven : theme.cellBackgroundOdd
                }}
            >
                {display}
            </div>
        );
    }

    renderHeader = ({ style, type, selection, viewIndex, theme }: IHeaderRendererEvent) => {
        const nextStyle: React.CSSProperties = {
            ...style,
            ...theme.headerStyle
        };

        switch (type) {
            case HeaderType.Row:
                nextStyle.borderBottomColor = theme.headerBorderColor;

                // viewIndex is undefined for parent headers, it will be covered later
                if (viewIndex == null) {
                    nextStyle.borderRightColor = theme.headerBorderColor;
                }
                break;

            case HeaderType.Column:
                nextStyle.borderRightColor = theme.headerBorderColor;

                // viewIndex is undefined for parent headers, it will be covered later
                if (viewIndex == null) {
                    nextStyle.borderBottomColor = theme.headerBorderColor;
                }
                break;
        }

        if (selection) {
            nextStyle.background = theme.headerBackgroundColorSelected;
        }

        nextStyle.justifyContent = type === HeaderType.Row ? 'flex-end' : 'center';

        return (
            <div style={nextStyle}>
                {
                    type === HeaderType.Column && viewIndex != null
                        ? this.excelIndex(viewIndex)
                        : viewIndex
                }
            </div>
        );
    }

    renderSelection = ({ key, style, active, edit, theme }: ISelectionRendererEvent) => {
        style.left--;
        style.top--;
        style.width++;
        style.height++;

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

    editorRenderer = ({ style, columnIndex, rowIndex, update, source, theme }: ICellEditorEvent) => {
        let key = `${rowIndex} x ${columnIndex}`;
        let initialValue = source[key] === void 0 ? key : source[key];
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
