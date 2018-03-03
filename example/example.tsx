import * as React from 'react';
import { Grid, Resizer, HeadersContainer, HeaderType, ICellMeasureResult, IGridTheme } from '../src';
import Editor from './editor';

export interface State {
    data?: {
        [key: string]: string;
    };
    headers?: HeadersContainer;
}

const THEME: IGridTheme = {
    // Scroller theme
    scrollbarWidth: 15,
    scrollbarWidthMinimized: 5,
    scrollbarMinimizeDistance: 100,
    styleTrackRoot: {
        transition: 'ease all 100ms',
        background: `rgba(15, 1, 38, 0.2)`
    },
    styleThumb: {
        background: `rgba(15, 1, 38, 0.8)`
    },

    // Grid theme
    style: {
        background: '#FFFFFF'
    },
    styleGridColumns: {
        background: '#3C3744',
        boxShadow: '0 0 5px #000',
        color: '#DBDADD'
    },
    styleGridRows: {
        background: '#3C3744',
        boxShadow: '0 0 5px #000',
        color: '#DBDADD'
    },
    styleGridCorner: {
        borderRight: 'solid 1px #000',
        borderBottom: 'solid 1px #000',
        background: '#3C3744',
        color: '#DBDADD',
        boxSizing: 'border-box'
    },

    // Custom grid theme properties
    cellTextColor: '#211E26',
    cellBorderColor: '#918B9C',
    cellBackgroundEven: '#EFEFEF',
    cellBackgroundOdd: '#FFFFFF',
    editorBorderColor: '#918B9C',
    editorBackground: '#FFFFFF',
    headerBorderColor: '#000000',
    headerBorderColorSelected: '#0F0126',
    headerBackgroundColorSelected: '#0F0126',
    selectionBackground: 'rgba(15, 1, 38, 0.2)',
    selectionBackgroundActive: 'transparent',
    selectionBorder: 'solid 1px #0F0126',
    selectionBorderActive: 'solid 2px #0F0126',
    resizerBackground: 'rgba(0, 0, 0, 0.4)'
};

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
                columns: new Array(100).fill(null).map(() => ({})),
                rows: new Array(200).fill(null).map(() => ({})),
                columnWidth: 100,
                rowHeight: 24,
                headersHeight: 24,
                headersWidth: 30
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
                    background: '#fff',
                    color: '#000'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
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
                        ⮌
                    </button>
                    <div style={{ margin: '0 10px' }}>
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
                        ⭮
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
                        theme={THEME}
                        onCopy={({ cells, withHeaders }) => {
                            console.log('copy', { cells, withHeaders });
                        }}
                        onPaste={({ target, clipboard, getLastSelectedCells }) => {
                            const selection = getLastSelectedCells();
                            console.log('paste', { target, clipboard, selection });
                        }}
                        onRenderCell={({ style, columnIndex, rowIndex, source, theme }) => {
                            let key = `${rowIndex} x ${columnIndex}`;
                            let display = source[key] === void 0 ? key : source[key];

                            return (
                                <div
                                    style={{
                                        ...style,
                                        boxSizing: 'border-box',
                                        borderRight: `solid 1px ${theme.cellBorderColor}`,
                                        borderBottom: `solid 1px ${theme.cellBorderColor}`,
                                        padding: '0 3px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: theme.cellTextColor,
                                        background: (
                                            rowIndex % 2
                                                ? theme.cellBackgroundEven
                                                : theme.cellBackgroundOdd
                                        )
                                    }}
                                >
                                    {display}
                                </div>
                            );
                        }}
                        onRenderEditor={({ style, columnIndex, rowIndex, update, source, theme }) => {
                            let key = `${rowIndex} x ${columnIndex}`;
                            let initialValue = source[key] === void 0 ? key : source[key];
                            return (
                                <div
                                    style={{
                                        ...style,
                                        boxSizing: 'border-box',
                                        borderRight: `solid 1px ${theme.editorBorderColor}`,
                                        borderBottom: `solid 1px ${theme.editorBorderColor}`,
                                        padding: '0 3px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: theme.editorBackground
                                    }}
                                >
                                    <Editor
                                        initialValue={initialValue}
                                        update={update}
                                    />
                                </div>
                            );
                        }}
                        onRenderHeader={({ style, type, selection, header, viewIndex, theme }) => {
                            let rcolor = (
                                type === HeaderType.Row && selection
                                    ? theme.headerBorderColorSelected
                                    : theme.headerBorderColor
                            );

                            let bcolor = (
                                type === HeaderType.Column && selection
                                    ? theme.headerBorderColorSelected
                                    : theme.headerBorderColor
                            );

                            let nextStyle: React.CSSProperties = {
                                ...style,
                                boxSizing: 'border-box',
                                borderRight: `solid 1px ${rcolor}`,
                                borderBottom: `solid 1px ${bcolor}`,
                                padding: '0 3px',
                                display: 'flex',
                                alignItems: 'center'
                            };

                            if (selection) {
                                nextStyle.backgroundColor = theme.headerBackgroundColorSelected;
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
                        onRenderSelection={({ key, style, active, edit, theme }) => {
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
                                        backgroundColor: (active || edit) ? theme.selectionBackgroundActive : theme.selectionBackground,
                                        border: active ? theme.selectionBorderActive : theme.selectionBorder
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
                        onHeaderResize={({ headers, levels, behavior }) => {
                            let next = state.headers;

                            if (headers) {
                                next = next.resizeHeaders({
                                    behavior,
                                    list: headers,
                                    clamp: ({ type, size }) => Math.max(size, type === HeaderType.Column ? 30 : 24)
                                });
                            }

                            if (levels) {
                                next = next.resizeLevels({
                                    behavior,
                                    levels: levels.map(({ level, size, type }) => {
                                        return {
                                            type, level, size,
                                            min: type === HeaderType.Column ? 25 : 30
                                        };
                                    })
                                });
                            }

                            if (state.headers === next) {
                                return;
                            }

                            this._push({
                                headers: next
                            }, behavior === 'auto');
                        }}
                        onRenderResizer={({ style, theme }) => {
                            style.background = theme.resizerBackground;
                            return (
                                <div style={style} />
                            );
                        }}
                        onAutoMeasure={({ cells, headers, callback }) => {
                            const ctx = document.createElement('canvas').getContext('2d');
                            ctx.font = `14px Verdana`;

                            let measuredCells = cells.map(({ columnIndex, rowIndex, source }) => {
                                let key = `${rowIndex} x ${columnIndex}`;
                                let value = source[key] === void 0 ? key : source[key];

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

                            let measuredLevels = headers.map(({ index, header, type }) => {
                                const text = String(
                                    type === HeaderType.Column && index != null
                                        ? this.excelIndex(index)
                                        : index
                                );

                                const width = ctx.measureText(String(text)).width + 10;

                                return {
                                    header, width, height: 24
                                };
                            });

                            callback({ cells: measuredCells, headers: measuredLevels });
                        }}
                    />
                </div>
            </div>
        );
    }
}

export default Example;
