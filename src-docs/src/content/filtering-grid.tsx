import * as React from 'react';
import EditableGrid from './editable-grid';
import { HistoryState } from './base-example';
import { HeaderType, HeadersContainer, IGridUpdateEvent } from 'react-bolivianite-grid';

const INPUT_STYLE: React.CSSProperties = {
    margin: 0,
    marginLeft: 'var(--padding-small)',
    border: 0,
    height: '25px',
    background: 'rgba(0, 0, 0, 0.3)',
    color: '#ffffff',
    boxSizing: 'border-box',
    padding: '0 5px',
    outline: 'none',
    flex: 1,
    borderBottom: 'rgba(255, 255, 255, 0.2) solid 1px',
    borderRadius: 4
};

export class FilteringGridExample extends EditableGrid {
    getInitialState() {
        return {
            history: [{
                data: {} as {
                    [key: string]: string;
                },
                headers: new HeadersContainer({
                    columns: new Array(100).fill(null).map((_, i) => ({ caption: `C${i + 1}`, index: i })),
                    rows: new Array(200).fill(null).map((_, i) => ({ caption: `R${i + 1}`, index: i })),
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

    renderCellValue(columnIndex: number, rowIndex: number, source: any) {
        const { headers } = this.currentState;
        const rh = headers.rows[rowIndex];
        const ch = headers.columns[columnIndex];

        const key = `${rh.caption} x ${ch.caption}`;
        return source[key] === void 0 ? key : source[key];
    }

    onUpdate = ({ cell, value }: IGridUpdateEvent) => {
        let { column, row } = cell;
        const { headers } = this.currentState;
        const rh = headers.rows[row];
        const ch = headers.columns[column];
        let key = `${rh.caption} x ${ch.caption}`;

        this.pushHistory({
            data: {
                ...this.currentState.data,
                [key]: value
            }
        });
    }

    renderAdditionalControls() {
        return (
            <input
                style={INPUT_STYLE}
                value={this.state.input}
                placeholder="Try to type header name."
                onChange={(e) => {
                    this.setState({ input: e.target.value });
                    const state = this.state.history[this.state.history.length - 1];

                    if (!state) {
                        return;
                    }

                    let v = e.target.value.toLowerCase();
                    let { headers } = state;

                    headers = headers.updateFilter(({ header, type }) => {
                        if ((v[0] === 'c' && type === HeaderType.Column) || (v[0] === 'r' && type === HeaderType.Row)) {
                            return header.caption.toLowerCase().indexOf(v) !== -1;
                        }

                        return true;
                    });

                    this.pushHistory({ headers });
                }}
            />
        );
    }
}

export default FilteringGridExample;
