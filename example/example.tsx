import * as React from 'react';
import { Grid, Resizer, HeadersContainer, HeaderType } from '../src';
import Editor from './editor';
import ExcelColumn from './header';

/*
Headers.create(
    new Array(3).fill(null).map(() => new ExcelColumn(
        new Array(3).fill(null).map(() => new ExcelColumn())
    ))
);
*/

export class Example extends React.Component<any, any> {
    state = {
        data: {} as {
            [key: string]: string;
        },
        headers: new HeadersContainer({
            columns: HeadersContainer.create(
                new Array(2).fill(null).map(() => new ExcelColumn(
                    new Array(2).fill(null).map(() => new ExcelColumn(
                        new Array(2).fill(null).map(() => new ExcelColumn())
                    ))
                ))
            ),
            rows: HeadersContainer.create(
                new Array(3).fill(null).map((_, i) => new ExcelColumn(
                    i !== 1 ? new Array(3).fill(null).map(() => new ExcelColumn()) : null
                ))
            ),
            columnWidth: 100,
            rowHeight: 24,
            headersHeight: 24,
            headersWidth: 50
        })
    };

    public render() {
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
                <div
                    style={{
                        width: '80vw',
                        height: '80vh',
                        border: '2px dashed #ddd',
                        boxSizing: 'border-box'
                    }}
                >
                    <Grid
                        headersContainer={this.state.headers}
                        overscanRows={3}
                        source={this.state.data}
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

                            let h = header as ExcelColumn;

                            if (selection) {
                                nextStyle.backgroundColor = `rgba(0, 0, 0, 0.1)`;
                            }

                            if (type === HeaderType.Row) {
                                nextStyle.justifyContent = 'flex-end';
                            }

                            return (
                                <div style={nextStyle}>
                                    {type === HeaderType.Row && header.index !== -1 ? header.index : h.print(h.id as number)}
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
                                ...this.state.data
                            };

                            cells.forEach(({ column, row }) => {
                                data[`${row} x ${column}`] = null;
                            });

                            this.setState({ data });
                        }}
                        onUpdate={({ cell, value }) => {
                            let { column, row } = cell;
                            let key = `${row} x ${column}`;

                            this.setState({
                                data: {
                                    ...this.state.data,
                                    [key]: value
                                }
                            });
                        }}
                        onHeaderResize={({ header, size }) => {
                            let min = header.type === HeaderType.Column ? 50 : 24;
                            header.updateSize(size, s => Math.max(s, min));

                            let headers = this.state.headers.update();
                            this.setState({ headers });
                        }}
                        onHeaderLevelResize={({ level, size, type }) => {
                            let min = type === HeaderType.Column ? 25 : 50;

                            let headers = this.state.headers.update({
                                [type === HeaderType.Row ? 'leftLevels' : 'topLevels']: {
                                    [level]: Math.max(size, min)
                                }
                            });

                            this.setState({ headers });
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
