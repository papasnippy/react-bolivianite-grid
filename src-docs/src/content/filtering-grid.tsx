import * as React from 'react';
import CopyPasteExample from './copy-paste-grid';
import { HeaderType, HeaderRepository, IHeader } from 'react-bolivianite-grid';

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

export default class extends CopyPasteExample {
    generateHeaders(rows: number, columns: number) {
        const colHeaders = (
            new Array(columns)
                .fill(null)
                .map((_, i) => {
                    return {
                        colIndex: i,
                        caption: `C${i}`
                    } as IHeader;
                })
        );

        const rowlHeaders = (
            new Array(rows)
                .fill(null)
                .map((_, i) => {
                    return {
                        rowIndex: i,
                        caption: `R${i}`
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
