import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Grid, ExcelHeader, Resizer } from '../src';

const div = document.createElement('div');
document.body.appendChild(div);

ReactDOM.render((
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
                rows={200}
                columns={20}
                defaultWidth={100}
                defaultHeight={24}
                headersHeight={24}
                headersWidth={50}
                overscanRows={3}
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
                onRenderCell={({ style, columnIndex, rowIndex }) => {
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
                            {`${rowIndex} x ${columnIndex}`}
                        </div>
                    );
                }}
                onRenderHeader={({ style, type, index, selection }) => {
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
                            {ExcelHeader({ type, index })}
                            <Resizer type={type} index={index} />
                        </div>
                    );
                }}
                onRenderSelection={({ key, style, active }) => {
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
                                backgroundColor: active ? null : `rgba(0, 125, 255, 0.2)`,
                                border: `solid ${active ? 2 : 1}px #0af`
                            }}
                        />
                    );
                }}
            />
        </div>
    </div>
), div);
