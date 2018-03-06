import * as React from 'react';
import {
    HeadersContainer, Resizer, IHeaderRendererEvent, HeaderType, ICellMeasureResult,
    ICellsMeasureEvent, IGridUpdateEvent, IGridNullifyEvent
} from 'react-bolivianite-grid';
import { HistoryState } from './base-example';
import GroupedHeadersExample from './grouped-headers-grid';

export class ExpandCollapseExample extends GroupedHeadersExample {
    getInitialState() {
        return {
            history: [{
                data: {} as {
                    [key: string]: string;
                },
                headers: new HeadersContainer({
                    columns: this.generateHeaders('C', 2, 3, 4),
                    rows: this.generateHeaders('R', 3, 4, 5),
                    columnWidth: 100,
                    rowHeight: 24,
                    headersHeight: 24,
                    headersWidth: 50
                })
            } as HistoryState],
            index: 0
        };
    }

    renderCellValue(columnIndex: number, rowIndex: number, source: any) {
        const ctr = this.currentState.headers;
        const col = ctr.columns[columnIndex].caption;
        const row = ctr.rows[rowIndex].caption;
        const key = `${row} x ${col}`;
        return source[key] === void 0 ? key : source[key];
    }

    onNullify = ({ cells }: IGridNullifyEvent) => {
        let data = {
            ...this.currentState.data
        };

        cells.forEach(({ column, row }) => {
            const ctr = this.currentState.headers;
            const c = ctr.columns[column].caption;
            const r = ctr.rows[row].caption;
            const key = `${r} x ${c}`;
            data[key] = null;
        });

        this.pushHistory({ data });
    }

    onUpdate = ({ cell, value }: IGridUpdateEvent) => {
        const ctr = this.currentState.headers;
        const col = ctr.columns[cell.column].caption;
        const row = ctr.rows[cell.row].caption;
        const key = `${row} x ${col}`;

        this.pushHistory({
            data: {
                ...this.currentState.data,
                [key]: value
            }
        });
    }

    renderHeader = ({ style, type, selection, header, theme }: IHeaderRendererEvent) => {
        const nextStyle: React.CSSProperties = {
            ...style,
            ...theme.headerStyle,
            justifyContent: 'flex-start',
            alignItems: 'flex-start'
        };

        const isParent = !header.$collapsed && header.$children && header.$children.length;

        switch (type) {
            case HeaderType.Row:
                nextStyle.borderBottomColor = theme.headerBorderColor;
                nextStyle.borderRightColor = isParent ? theme.headerBorderColor : 'transparent';
                break;

            case HeaderType.Column:
                nextStyle.borderRightColor = theme.headerBorderColor;
                nextStyle.borderBottomColor = isParent ? theme.headerBorderColor : 'transparent';
                break;
        }

        if (selection) {
            nextStyle.background = theme.headerBackgroundColorSelected;
        }


        return (
            <div style={nextStyle}>
                {header.$children && header.$children.length &&
                    <button
                        style={{
                            cursor: 'pointer',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 0,
                            borderRadius: 3,
                            color: '#FFFFFF',
                            marginBottom: 3,
                            marginRight: 3,
                            height: 18
                        }}
                        onMouseDown={(e) => {
                            // stop grid from selecting
                            e.stopPropagation();
                            e.preventDefault();

                            let { data, headers } = this.currentState;

                            headers = headers.updateHeaders([{
                                header,
                                update: {
                                    $collapsed: !header.$collapsed
                                }
                            }]);

                            this.pushHistory({
                                data, headers
                            });
                        }}
                    >
                        {header.$collapsed ? '+' : '-'}
                    </button>
                }
                {header.caption}
                <Resizer header={header} />
            </div>
        );
    }

    autoMeasure = ({ cells, headers, callback }: ICellsMeasureEvent) => {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `12px "Open Sans", Verdana, Geneva, Tahoma, sans-serif`;

        let measuredCells = cells.map(({ columnIndex, rowIndex, source }) => {
            const value = this.renderCellValue(columnIndex, rowIndex, source);

            if (value == null || value === '') {
                return null;
            }

            return {
                row: rowIndex,
                column: columnIndex,
                height: 0,
                width: ctx.measureText(String(value)).width + 10
            } as ICellMeasureResult;
        });

        let measuredHeaders = headers.map(({ header }) => {
            const width = ctx.measureText(String(header.caption)).width + 10 + (header.$children && header.$children.length ? 20 : 0);

            return {
                header, width,
                height: this.currentState.headers.headersHeight // default row height
            };
        });

        callback({ cells: measuredCells, headers: measuredHeaders });
    }
}

export default ExpandCollapseExample;
