import * as React from 'react';

export interface IResizerProps {
    type: 'rows' | 'columns';
    index: number;
}

export class Resizer extends React.PureComponent<any, any> {
    private static _r: React.CSSProperties = {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 3,
        cursor: 'col-resize'
    };

    private static _b: React.CSSProperties = {
        position: 'absolute',
        right: 0,
        height: 3,
        bottom: 0,
        left: 0,
        cursor: 'row-resize'
    };

    public render() {
        return (
            <>
                <div
                    x-resizer={`r:${this.props.type}:${this.props.index}`}
                    style={Resizer._r}
                />
                <div
                    x-resizer={`b:${this.props.type}:${this.props.index}`}
                    style={Resizer._b}
                />
            </>
        );
    }
}
