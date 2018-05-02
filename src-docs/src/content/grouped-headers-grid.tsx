import * as React from 'react';
import Grid, {
    Resizer, HeadersContainer, IHeader, IHeaderRendererEvent, HeaderType,
    ICellsMeasureEvent, ICellMeasureResult
} from 'react-bolivianite-grid';
import { HistoryState } from './base-example';
import AutosizingGridExample from './autosizing-grid';
import Theme from './style';

export class GroupedHeadersExample extends AutosizingGridExample {
    generateList(c: string, n: number, ct: { c?: number }, ch?: () => IHeader[]) {
        return new Array(n)
            .fill(null)
            .map((_v) => {
                ct.c = (ct.c || 0) + 1;
                return {
                    caption: `${c} (${ct.c})`,
                    $children: ch ? ch() : null
                } as IHeader;
            });
    }

    generateHeaders(s: string, n1: number, n2: number, n3: number) {
        const l1 = {}, l2 = {}, l3 = {};

        return this.generateList(`${s}1`, n1, l1, () => {
            return this.generateList(`${s}2`, n2, l2, () => {
                return this.generateList(`${s}3`, n3, l3);
            });
        });
    }

    getInitialState() {
        return {
            history: [{
                data: {} as {
                    [key: string]: string;
                },
                headers: new HeadersContainer({
                    columns: this.generateHeaders('C', 4, 4, 4),
                    rows: this.generateHeaders('R', 10, 4, 2),
                    columnWidth: 100,
                    rowHeight: 24,
                    headersHeight: 24,
                    headersWidth: 50
                })
            } as HistoryState],
            index: 0,
            input: ''
        };
    }

    /**
     * viewIndex is undefined for parent headers
     */
    renderHeader = ({ style, type, selection, viewIndex, header, theme }: IHeaderRendererEvent) => {
        const nextStyle: React.CSSProperties = {
            ...style,
            ...theme.headerStyle
        };


        switch (type) {
            case HeaderType.Row:
                nextStyle.borderBottomColor = theme.headerBorderColor;

                if (viewIndex == null) {
                    nextStyle.borderRightColor = theme.headerBorderColor;
                }
                break;

            case HeaderType.Column:
                nextStyle.borderRightColor = theme.headerBorderColor;

                if (viewIndex == null) {
                    nextStyle.borderBottomColor = theme.headerBorderColor;
                }
                break;
        }

        if (selection) {
            nextStyle.background = theme.headerBackgroundColorSelected;
        }


        if (viewIndex != null) {
            nextStyle.justifyContent = type === HeaderType.Row ? 'flex-end' : 'center';
        } else {
            nextStyle.justifyContent = 'flex-start';
            nextStyle.alignItems = 'flex-start';
        }

        let caption = (
            viewIndex == null
                ? header.caption
                : type === HeaderType.Column
                    ? this.excelIndex(viewIndex)
                    : viewIndex
        );

        return (
            <div style={nextStyle}>
                {caption}
                <Resizer header={header} />
            </div>
        );
    }

    autoMeasure = ({ cells, headers, callback }: ICellsMeasureEvent) => {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `12px "Open Sans", Verdana, Geneva, Tahoma, sans-serif`;

        let measuredCells = cells.map(({ column, row, source }) => {
            const value = this.renderCellValue(column, row, source);

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
            let caption = (
                index == null
                    ? header.caption
                    : type === HeaderType.Column
                        ? this.excelIndex(index)
                        : index
            );

            const text = String(caption);

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
                onRenderResizer={this.renderResizer}
                onHeaderResize={this.resizeHeaders}
                onAutoMeasure={this.autoMeasure}
            />
        );
    }
}

export default GroupedHeadersExample;
