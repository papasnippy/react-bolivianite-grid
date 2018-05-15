import * as React from 'react';
import CopyPasteExample from './copy-paste-grid';
import { HeaderType, HeaderRepository, IHeader } from 'react-bolivianite-grid';

export default class extends CopyPasteExample {
    state = {
        history: [{
            data: new Map<string, string>(),
            repository: this.generateRepository(200, 200)
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
                style={{
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
                }}
                value={this.state.input}
                placeholder="Try to type header name."
                onChange={(e) => {
                    const state = this.state.history[this.state.history.length - 1];

                    let v = e.target.value.toLowerCase();
                    let { repository } = state;

                    repository = repository.updateFilter(({ header, type }) => {
                        if ((v[0] === 'c' && type === HeaderType.Column) || (v[0] === 'r' && type === HeaderType.Row)) {
                            return header.caption.toLowerCase().indexOf(v) !== -1;
                        }

                        return true;
                    });

                    this.setState({ input: e.target.value });
                    this.pushHistory({ repository });
                }}
            />
        );
    }
}
