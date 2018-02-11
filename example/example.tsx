import * as React from 'react';
import { Grid, Resizer, HeadersContainer, HeaderType } from '../src';
import Editor from './editor';

interface State {
    data?: {
        [key: string]: string;
    };
    headers?: HeadersContainer;
}

export class Example extends React.Component<any, any> {
    state = {
        history: [this._getInitialState()],
        index: 0
    };

    private _getInitialState(): State {
        return {
            data: {} as {
                [key: string]: string;
            },
            headers: new HeadersContainer({
                columns: [
                    { $children: [{ $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }] },
                    { $children: [{ $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }] },
                    { $children: [{ $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }] }
                ],
                rows: [
                    { $children: [{ $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }] },
                    { $children: [{ $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }] },
                    { $children: [{ $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }, { $children: [{}, {}, {}] }] }
                ],
                // columns: [{}, {}, {}],
                // rows: [{}],
                columnWidth: 100,
                rowHeight: 24,
                headersHeight: 24,
                headersWidth: 50
            })
        };
    }

    private _push(state: State) {
        let ix = this.state.index;
        let is = this.state.history[ix];

        this.setState({
            index: ix + 1,
            history: [
                ...this.state.history.slice(0, ix + 1),
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
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Verdana',
                    fontSize: 14
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                </div>
                <div
                    style={{
                        width: '80vw',
                        height: '80vh',
                        border: '2px dashed #ddd',
                        boxSizing: 'border-box'
                    }}
                >
                    <Grid
                        headers={state.headers}
                        overscanRows={3}
                        source={state.data}
                        styles={{
                            corner: {
                                borderRight: 'solid 1px #999',
                                borderBottom: 'solid 1px #999',
                                background: '#ccc'
                            },
                            columns: {
                                background: '#ccc'
                            },
                            rows: {
                                background: '#ccc'
                            }
                        }}
                        onRenderCell={({ style, columnIndex, rowIndex, source }) => {
                            let key = `${rowIndex} x ${columnIndex}`;
                            let display = source[key] === void 0 ? key : source[key];

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
                        onRenderHeader={({ style, type, selection, header }) => {
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

                            let headerType = state.headers.getHeaderType(header);
                            let viewIndex = state.headers.getViewIndex(header);
                            return (
                                <div style={nextStyle}>
                                    {
                                        headerType === HeaderType.Column && viewIndex != null
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
                        onHeaderResize={({ header, size }) => {
                            let headerType = state.headers.getHeaderType(header);
                            let headers = state.headers.resizeHeader(header, size, headerType === HeaderType.Column ? 50 : 24);

                            this._push({
                                headers
                            });
                        }}
                        onHeaderLevelResize={({ type, level, size }) => {
                            let headers = state.headers.resizeLevel(type, level, size, type === HeaderType.Column ? 25 : 50);

                            this._push({
                                headers
                            });
                        }}
                        onRenderResizer={({ style }) => {
                            style.background = `rgba(0, 0, 0, 0.4)`;
                            return (
                                <div style={style} />
                            );
                        }}
                    />
                </div>
            </div>
        );
    }
}

export default Example;
