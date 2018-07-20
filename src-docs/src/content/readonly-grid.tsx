import * as React from 'react';
import CopyPasteExample from './copy-paste-grid';
import { ICellRendererEvent, HeaderRepository, IHeader } from 'react-bolivianite-grid';
import Grid from 'react-bolivianite-grid';
import Theme from './style';

export default class extends CopyPasteExample {
    state = {
        history: [{
            data: new Map<string, string>(),
            repository: this.generateRepository(15, 6)
        }],
        index: 0,
        input: ''
    };

    generateRepository(rows: number, columns: number) {
        const colHeaders = (
            new Array(columns)
                .fill(null)
                .map((_, i) => {
                    return {
                        colIndex: i,
                        caption: `C${i}`,
                        $readOnly: i == 1
                    } as IHeader;
                })
        );

        const rowlHeaders = (
            new Array(rows)
                .fill(null)
                .map((_, i) => {
                    return {
                        rowIndex: i,
                        caption: `R${i}`,
                        $readOnly: i == 1
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

    renderCell = ({ style, row, data, rowHeader, columnHeader, theme }: ICellRendererEvent) => {
        return (
            <div
                style={{
                    ...style,
                    ...theme.cellStyle,
                    background: (
                        rowHeader.$readOnly || columnHeader.$readOnly || rowHeader.rowIndex >= 10 && columnHeader.colIndex >= 4
                            ? '#999'
                            : row % 2 ? theme.cellBackgroundEven : theme.cellBackgroundOdd
                    )
                }}
            >
                {this.getValue(rowHeader, columnHeader, data )}
            </div>
        );
    }

    renderGrid() {
        const { data, repository } = this.currentState;
        return (
            <Grid
                repository={repository}
                overscanRows={3}
                data={data}
                theme={Theme}
                onRenderCell={this.renderCell}
                onRenderHeader={this.renderHeader}
                onRenderSelection={this.renderSelection}
                onRenderEditor={this.editorRenderer}
                onNullify={this.onNullify}
                onUpdate={this.onUpdate}
                onCopy={this._cpb.onCopy}
                onPaste={this._cpb.onPaste}
                // This is optional. $readOnly will work even without this function.
                // However, we are using it to additionaly make bottom right part of the grid readonly too.
                // And because we are using this function, $readOnly will no longer be used by default, so
                // we need to use this property here too.
                onReadOnly={({ row, column }) => {
                    return row.$readOnly || column.$readOnly || row.rowIndex >= 10 && column.colIndex >= 4;
                }}
            />
        );
    }
}
