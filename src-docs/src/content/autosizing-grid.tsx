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

    /**
     * I use this method to get text width by providing known text style.
     * Unfortunately, there is no method to get exact cell's size really fast.
     * You can render full cell component and get it's rendered size,
     * but it can take a lot of time when you will try to measure a lot of cells.
     * So implementing automeasuring is up to you. In excel like spreadsheets this
     * method very fast and it is enough in many cases.
     */
    autoMeasure = ({ cells, headers, callback, data }: ICellsMeasureEvent) => {
        const ctx = document.createElement('canvas').getContext('2d');

        // Get font style from global CSS variables
        const bodyStyle = getComputedStyle(document.body);
        const fontStyle = bodyStyle.getPropertyValue('--app--font-family');
        const fontSize = bodyStyle.getPropertyValue('--app--font-size');
        ctx.font = `${fontSize} ${fontStyle}`;

        const measuredCells = cells.map(({ column, row, columnHeader, rowHeader }) => {
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

        const height = this.currentState.repository.headersHeight; // default row height
        const measuredLevels = headers.map(({ header, type }) => {
            const width = this.measureHeader(header, type, ctx) + 10;

            return {
                header, width, height
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

