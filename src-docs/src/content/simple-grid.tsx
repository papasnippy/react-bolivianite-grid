import * as React from 'react';
import Grid, {
    HeaderRepository, HeaderType, ICellRendererEvent, IHeaderRendererEvent,
    ISelectionRendererEvent, IHeader
} from 'react-bolivianite-grid';
import Theme from './style';

export default class extends React.Component {
    state = {
        repository: this.generateRepository(200, 100)
    };

    generateRepository(rows: number, columns: number) {
        const colHeaders = (
            new Array(columns)
                .fill(null)
                .map((_, i) => {
                    return {
                        colIndex: i
                    } as IHeader;
                })
        );

        const rowlHeaders = (
            new Array(rows)
                .fill(null)
                .map((_, i) => {
                    return {
                        rowIndex: i
                    } as IHeader;
                })
        );

        return new HeaderRepository({
            columns: colHeaders,
            rows: rowlHeaders,
            columnWidth: 100,
            rowHeight: 24,
            headersHeight: 24,
            headersWidth: 50
        });
    }

    /** This function converts number index to Excel-like column name. */
    excelIndex(index: number) {
        index++;
        let c = '';

        for (let a = 1, b = 26; (index -= a) >= 0; a = b, b *= 26) {
            c = String.fromCharCode(~~((index % b) / a) + 65) + c;
        }

        return c;
    }

    /** Rendering cell. Using header's rowIndex and colIndex as cell's content. */
    renderCell = ({ style, row, theme, rowHeader, columnHeader }: ICellRendererEvent) => {
        return (
            <div
                style={{
                    // Provided positioning style must be applied to each cell
                    ...style,
                    // Adding fancy cell style
                    ...theme.cellStyle,
                    background: row % 2 ? theme.cellBackgroundEven : theme.cellBackgroundOdd
                }}
            >
                {`${rowHeader.rowIndex} x ${columnHeader.colIndex}`}
            </div>
        );
    }

    /** Rendering header. */
    renderHeader = ({ style, type, selection, theme, header }: IHeaderRendererEvent) => {
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

        // Selection flag means that index of this header is inside user's selection
        if (selection) {
            nextStyle.background = theme.headerBackgroundColorSelected;
        }

        nextStyle.justifyContent = type === HeaderType.Row ? 'flex-end' : 'center';

        return (
            <div style={nextStyle}>
                {
                    type === HeaderType.Column
                        ? this.excelIndex(header.colIndex)
                        : header.rowIndex
                }
            </div>
        );
    }

    /** Rendering user's selection. */
    renderSelection = ({ key, style, active, edit, theme }: ISelectionRendererEvent) => {
        // Modifying style size for proper border positioning.
        style.left = Number(style.left) - 1;
        style.top = Number(style.top) - 1;
        style.width = Number(style.width) + 1;
        style.height = Number(style.height) + 1;

        // `active` flag uses for active cell (cursor) indication.
        // Usually this is normal selection component with transparent
        // background and bold borders.
        // `edit` is same, but rendered when cell is edited.

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

    render() {
        // Note, that current grid does not use any data source. For now.
        return (
            <Grid
                readOnly
                repository={this.state.repository}
                overscanRows={3}
                theme={Theme}
                onRenderCell={this.renderCell}
                onRenderHeader={this.renderHeader}
                onRenderSelection={this.renderSelection}
            />
        );
    }
}
