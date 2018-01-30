import * as React from 'react';
import { Grid, Resizer, Headers } from '../src';
import Editor from './editor';
import ExcelColumn from './header';

export class Example extends React.Component<any, any> {
    state = {
        data: {} as {
            [key: string]: string;
        },
        headers: new Headers({
            columns: new Array(50).fill(null).map(_ => new ExcelColumn()),
            rows: 200,
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
                        refHeaders={this.state.headers}
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
                        onRenderHeader={({ style, type, index, selection, header }) => {
                            return (
                                <div
                                    style={{
                                        ...style,
                                        boxSizing: 'border-box',
                                        borderRight: `solid 1px #${type === 'rows' && selection ? '0af' : '999'}`,
                                        borderBottom: `solid 1px #${type === 'columns' && selection ? '0af' : '999'}`,
                                        padding: '0 3px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    {type === 'columns' ? (header as ExcelColumn).print(index) : index + 1}
                                    <Resizer type={type} index={index} />
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
                    />
                </div>
            </div>
        );
    }
}

export default Example;
