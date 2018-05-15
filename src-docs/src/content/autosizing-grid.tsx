import * as React from 'react';
import Grid, {
    ICellsMeasureEvent, ICellMeasureResult, HeaderType, IHeader
} from 'react-bolivianite-grid';
import ResizingGrid from './resizing-grid';
import Theme from './style';

export default class extends ResizingGrid {
    measureHeader(header: IHeader, type: HeaderType, ctx: CanvasRenderingContext2D) {
        const text = this.getHeaderCaption(header, type);
        return ctx.measureText(String(text)).width;
    }

    /** We use this method to get text width by providing known text style.
     * Unfortunately, there is no method to get exact cell size really fast.
     * You can render need cell and get it size, but it will take much time.
     * So this automeasuring is up to you. In excel like spreadsheets this
     * method is enough.
     */
    autoMeasure = ({ cells, headers, callback, data }: ICellsMeasureEvent) => {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `13px "Open Sans", Verdana, Geneva, Tahoma, sans-serif`;

        let measuredCells = cells.map(({ column, row, columnHeader, rowHeader }) => {
            const value = this.getValue(rowHeader, columnHeader, data);

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

        let measuredLevels = headers.map(({ header, type }) => {
            const width = this.measureHeader(header, type, ctx) + 10;

            return {
                header, width,
                height: this.currentState.repository.headersHeight // default row height
            };
        });

        callback({ cells: measuredCells, headers: measuredLevels });
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
                onRenderResizer={this.renderResizer}
                onHeaderResize={this.resizeHeaders}
                onAutoMeasure={this.autoMeasure}
            />
        );
    }
}

