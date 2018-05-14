import * as React from 'react';
import Grid, {
    HeaderType, ICellsMeasureEvent, ICellMeasureResult
} from 'react-bolivianite-grid';
import ResizingGrid from './resizing-grid';
import Theme from './style';

export default class extends ResizingGrid {
    /** We use this method to get text width by providing known text style.
     * Unfortunately, there is no method to get exact cell size really fast.
     * You can render need cell and get it size, but it will take much time.
     * So this automeasuring is up to you. In excel like spreadsheets this
     * method is enough.
     */
    autoMeasure = ({ cells, headers, callback }: ICellsMeasureEvent) => {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `13px "Open Sans", Verdana, Geneva, Tahoma, sans-serif`;

        let measuredCells = cells.map(({ column, row, source, columnHeader, rowHeader }) => {
            const value = this.getValue(rowHeader, columnHeader, source);

            if (value == null || value === '') {
                return null;
            }

            return {
                row: row,
                column: column,
                height: 0,
                width: ctx.measureText(String(value)).width + 10
            } as ICellMeasureResult;
        });

        let measuredLevels = headers.map(({ index, header, type }) => {
            const text = String(
                type === HeaderType.Column && index != null
                    ? this.excelIndex(index)
                    : index
            );

            const width = ctx.measureText(String(text)).width + 10;

            return {
                header, width,
                height: this.currentState.headers.headersHeight // default row height
            };
        });

        callback({ cells: measuredCells, headers: measuredLevels });
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
                onCopy={this._cpb.onCopy}
                onPaste={this._cpb.onPaste}
                onRenderResizer={this.renderResizer}
                onHeaderResize={this.resizeHeaders}
                onAutoMeasure={this.autoMeasure}
            />
        );
    }
}

