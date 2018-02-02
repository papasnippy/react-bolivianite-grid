import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Header, Headers } from '../models';
import { Grid } from '../components/grid';
import { HeaderType } from '../types';

export interface IResizerProps {
    header: Header;
}

export class Resizer extends React.PureComponent<IResizerProps, any> {
    static contextTypes = {
        grid: PropTypes.object,
        headers: PropTypes.object
    };

    private static _r: React.CSSProperties = {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 6,
        cursor: 'col-resize'
    };

    private static _b: React.CSSProperties = {
        position: 'absolute',
        right: 0,
        height: 6,
        bottom: 0,
        left: 0,
        cursor: 'row-resize'
    };

    private _moving: {
        start: number;
        type: 'left-level' | 'top-level' | 'row' | 'column';
    } = null;

    private _moveListener: any = null;
    private _upListener: any = null;

    private get _grid() {
        return this.context['grid'] as Grid;
    }

    private get _model() {
        return this.context['headers'] as Headers;
    }

    private _unbind() {
        if (this._moveListener) {
            document.body.removeEventListener('mousemove', this._moveListener);
            this._moveListener = null;
        }

        if (this._upListener) {
            window.removeEventListener('mouseup', this._upListener);
            this._upListener = null;
        }

        this._moving = null;
    }

    private _onMove(_change: number) {

    }

    private _onChange(change: number) {
        if (!this._moving) {
            return;
        }

        let { type } = this._moving;
        let { header } = this.props;

        switch (type) {
            case 'column':
            case 'row':
                this._grid.resizeHeader({
                    type: type === 'row' ? HeaderType.Row : HeaderType.Column,
                    header: header,
                    size: header.size + change
                });
                break;

            case 'left-level':
            case 'top-level':
                let start = (
                    type === 'left-level'
                        ? this._model.getLeftLevelWidth(header._level)
                        : this._model.getTopLevelHeight(header._level)
                );
                this._grid.resizeLevel({
                    type: type === 'left-level' ? HeaderType.Row : HeaderType.Column,
                    level: header._level,
                    size: start + change
                });
                break;
        }
    }

    private _onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        let type = e.currentTarget.getAttribute('x-type') as ('r' | 'b');
        let p = type === 'r' ? e.pageX : e.pageY;
        let isRow = this.props.header._type === HeaderType.Row;

        this._unbind();

        this._moving = {
            type: (
                type === 'r'
                    ? isRow
                        ? 'left-level'
                        : 'column'
                    : isRow
                        ? 'row'
                        : 'top-level'
            ),
            start: p
        };

        let change = 0;

        window.addEventListener('mouseup', this._upListener = () => {
            this._onChange(change);
            this._unbind();
        });

        document.body.addEventListener('mousemove', this._moveListener = (ev: MouseEvent) => {
            if (!this._moving) {
                return;
            }

            let m = type === 'r' ? ev.pageX : ev.pageY;
            change = m - this._moving.start;
            this._onMove(change);
        });
    }

    public componentWillUnmount() {
        this._unbind();
    }

    public render() {
        return (
            <>
                <div
                    x-type='r'
                    style={Resizer._r}
                    onMouseDown={this._onMouseDown}
                />
                <div
                    x-type='b'
                    style={Resizer._b}
                    onMouseDown={this._onMouseDown}
                />
            </>
        );
    }
}
