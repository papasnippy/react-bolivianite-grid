import * as React from 'react';
import { Grid, Resizer, HeadersContainer, HeaderType, ICellMeasureResult } from '../src';
import Editor from './editor';

export interface State {
    data?: {
        [key: string]: string;
    };
    headers?: HeadersContainer;
}

const LIGHT_THEME = {
    scrollSize: 12,
    trackBackground: `rgba(128, 128, 128, 0.8)`,
    thumbBackground: `rgba(0, 0, 0, 0.5)`,
    styles: {
        columns: {
            background: '#ccc'
        },
        rows: {
            background: '#ccc'
        },
        gridCorner: {
            borderRight: 'solid 1px #999',
            borderBottom: 'solid 1px #999',
            background: '#ccc',
            boxSizing: 'border-box'
        },
        bottomThumb: {
            borderRadius: 10
        },
        rightThumb: {
            borderRadius: 10
        },
    }
};

const DARK_THEME = {
    scrollSize: 12,
    trackBackground: `rgba(0, 0, 0, 0.8)`,
    thumbBackground: `rgba(150, 150, 150, 0.8)`,
    styles: {
        columns: {
            background: '#444'
        },
        rows: {
            background: '#444'
        },
        gridCorner: {
            borderRight: 'solid 1px #999',
            borderBottom: 'solid 1px #999',
            background: '#444',
            boxSizing: 'border-box'
        },
        bottomThumb: {
            borderRadius: 10
        },
        rightThumb: {
            borderRadius: 10
        },
    }
};

export class Example extends React.Component<any, any> {
    state = {
        history: [this._getInitialState()],
        index: 0,
        dark: false
    };

    private _getInitialState(): State {
        return {
            data: {} as {
                [key: string]: string;
            },
            headers: new HeadersContainer({
                // columns: [
                //     { $children: [{ $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }] },
                //     { $children: [{ $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }] },
                //     { $children: [{ $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }] }
                // ],
                // rows: [
                //     { $children: [{ $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }] },
                //     { $children: [{ $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }] },
                //     { $children: [{ $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }] }
                // ],
                // columns: [{}, {}, {}],
                // rows: [{}],
                columns: new Array(50).fill(null).map(() => ({})),
                rows: new Array(200).fill(null).map(() => ({})),
                columnWidth: 100,
                rowHeight: 24,
                headersHeight: 24,
                headersWidth: 50
            })
        };
    }

    private _push(state: State, autosize = false) {
        let ix = this.state.index;
        let is = this.state.history[ix];
        let n = autosize ? 0 : 1;

        this.setState({
            index: ix + n,
            history: [
                ...this.state.history.slice(0, ix + n),
                {
                    ...is,
                    ...state
                }
            ]
        });
    }

    public excelIndex(index: number) {
        index++;
        let c = '';

        for (let a = 1, b = 26; (index -= a) >= 0; a = b, b *= 26) {
            c = String.fromCharCode(~~((index % b) / a) + 65) + c;
        }

        return c;
    }

    public render() {
        let state = this.state.history[this.state.index];

        return (
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Verdana',
                    fontSize: 14,
                    background: this.state.dark ? '#333' : '#fff',
                    color: this.state.dark ? '#eee' : '#000'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <button
                        onClick={() => {
                            if (!this.state.index) {
                                return;
                            }

                            this.setState({
                                index: this.state.index - 1
                            });
                        }}
                    >
                        UNDO
                    </button>
                    <div>
                        H: {this.state.index}/{this.state.history.length - 1}
                    </div>
                    <button
                        onClick={() => {
                            if (this.state.index === (this.state.history.length - 1)) {
                                return;
                            }

                            this.setState({
                                index: this.state.index + 1
                            });
                        }}
                    >
                        REDO
                    </button>
                    <button
                        onClick={() => {
                            this.setState({
                                dark: !this.state.dark
                            });
                        }}
                    >
                        {this.state.dark ? 'DARK' : 'LIGHT'} THEME
                    </button>
                </div>
                <div
                    style={{
                        width: '80vw',
                        height: '80vh',
                        border: 'solid 2px black',
                        boxSizing: 'border-box'
                    }}
                >
                    <Grid
                        headers={state.headers}
                        overscanRows={3}
                        source={state.data}
                        theme={this.state.dark ? DARK_THEME : LIGHT_THEME}
                        onRenderCell={({ style, columnIndex, rowIndex, source }) => {
                            let key = `${rowIndex} x ${columnIndex}`;
                            let display = source[key] === void 0 ? key : source[key];
                            let borderColor = this.state.dark ? `#555` : `#aaa`;

                            return (
                                <div
                                    style={{
                                        ...style,
                                        boxSizing: 'border-box',
                                        borderRight: `solid 1px ${borderColor}`,
                                        borderBottom: `solid 1px ${borderColor}`,
                                        padding: '0 3px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: (
                                            rowIndex % 2
                                                ? this.state.dark ? `#222` : `#eee`
                                                : this.state.dark ? `#111` : `#fff`
                                        )
                                    }}
                                >
                                    {display}
                                </div>
                            );
                        }}
                        onRenderEditor={({ style, columnIndex, rowIndex, update, source }) => {
                            let key = `${rowIndex} x ${columnIndex}`;
                            let initialValue = source[key] === void 0 ? key : source[key];
                            return (
                                <div
                                    style={{
                                        ...style,
                                        boxSizing: 'border-box',
                                        borderRight: 'solid 1px #aaa',
                                        borderBottom: 'solid 1px #aaa',
                                        padding: '0 3px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: rowIndex % 2 ? `#eee` : `#fff`
                                    }}
                                >
                                    <Editor
                                        initialValue={initialValue}
                                        update={update}
                                    />
                                </div>
                            );
                        }}
                        onRenderHeader={({ style, type, selection, header, viewIndex }) => {
                            let nextStyle: React.CSSProperties = {
                                ...style,
                                boxSizing: 'border-box',
                                borderRight: `solid 1px #${type === HeaderType.Row && selection ? '0af' : '999'}`,
                                borderBottom: `solid 1px #${type === HeaderType.Column && selection ? '0af' : '999'}`,
                                padding: '0 3px',
                                display: 'flex',
                                alignItems: 'center'
                            };

                            if (selection) {
                                nextStyle.backgroundColor = `rgba(0, 0, 0, 0.1)`;
                            }

                            if (type === HeaderType.Row) {
                                nextStyle.justifyContent = 'flex-end';
                            }

                            return (
                                <div style={nextStyle}>
                                    {
                                        type === HeaderType.Column && viewIndex != null
                                            ? this.excelIndex(viewIndex)
                                            : viewIndex
                                    }
                                    <Resizer header={header} />
                                </div>
                            );
                        }}
                        onRenderSelection={({ key, style, active, edit }) => {
                            style.left--;
                            style.top--;
                            style.width++;
                            style.height++;

                            return (
                                <div
                                    key={key}
                                    style={{
                                        ...style,
                                        boxSizing: 'border-box',
                                        backgroundColor: (edit || active) ? null : `rgba(0, 125, 255, 0.2)`,
                                        border: `solid ${active ? 2 : 1}px #0af`
                                    }}
                                />
                            );
                        }}
                        onNullify={({ cells }) => {
                            let data = {
                                ...state.data
                            };

                            cells.forEach(({ column, row }) => {
                                data[`${row} x ${column}`] = null;
                            });

                            this._push({ data });
                        }}
                        onUpdate={({ cell, value }) => {
                            let { column, row } = cell;
                            let key = `${row} x ${column}`;

                            this._push({
                                data: {
                                    ...state.data,
                                    [key]: value
                                }
                            });
                        }}
                        onHeaderResize={({ headers, behavior }) => {
                            this._push({
                                headers: state.headers.resizeHeaders(
                                    headers,
                                    ({ type, size }) => Math.max(size, type === HeaderType.Column ? 50 : 24),
                                    behavior
                                )
                            }, behavior === 'auto');
                        }}
                        onHeaderLevelResize={({ type, level, size }) => {
                            this._push({
                                headers: state.headers.resizeLevel(type, level, size, type === HeaderType.Column ? 25 : 50)
                            });
                        }}
                        onRenderResizer={({ style }) => {
                            style.background = `rgba(0, 0, 0, 0.4)`;
                            return (
                                <div style={style} />
                            );
                        }}
                        onAutoMeasure={({ cells, callback }) => {
                            let ctx = document.createElement('canvas').getContext('2d');
                            ctx.font = `14px Verdana`;

                            let values = cells.map(({ columnIndex, rowIndex, source }) => {
                                let value = source[`${rowIndex} x ${columnIndex}`];

                                if (value == null || value === '') {
                                    return null;
                                }

                                return {
                                    rowIndex,
                                    columnIndex,
                                    height: 0,
                                    width: ctx.measureText(String(value)).width + 6 // 6 is cell padding
                                } as ICellMeasureResult;
                            });

                            callback(values);
                        }}
                    />
                </div>
            </div>
        );
    }
}

export default Example;
