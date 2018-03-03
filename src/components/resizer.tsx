import * as React from 'react';
import * as PropTypes from 'prop-types';
import { HeadersContainer, IHeader, HeaderType } from '../models';
import { Grid } from '../components/grid';

export interface IResizerProps {
    header: IHeader;
}

export class Resizer extends React.PureComponent<IResizerProps, any> {
    /** React v17 deprecated */
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

    private _lastClick: {
        type: 'left-level' | 'top-level' | 'row' | 'column';
        time: number;
    };

    private _moveListener: any = null;
    private _upListener: any = null;
    private _escListener: any = null;
    private _moved = false;

    private get _grid() {
        return this.context['grid'] as Grid;
    }

    private get _container() {
        return this.context['headers'] as HeadersContainer;
    }

    private _unbind() {
        if (this._moving) {
            this._grid.previewResizeHeader(null);
            this._grid.previewResizeLevel(null);
        }

        if (this._moveListener) {
            document.body.removeEventListener('mousemove', this._moveListener);
            this._moveListener = null;
        }

        if (this._upListener) {
            window.removeEventListener('mouseup', this._upListener);
            this._upListener = null;
        }

        if (this._escListener) {
            window.removeEventListener('keydown', this._escListener);
            this._escListener = null;
        }

        this._moving = null;
    }

    private _onMove(change: number) {
        if (!this._moving) {
            return;
        }

        let { type } = this._moving;
        let { header } = this.props;

        switch (type) {
            case 'column':
            case 'row':
                this._grid.previewResizeHeader({
                    header: header,
                    change: change,
                });
                break;

            case 'left-level':
            case 'top-level':
                this._grid.previewResizeLevel({
                    header: header,
                    change: change,
                });
                break;
        }
    }

    private _onChange(change: number) {
        if (!this._moving || !this._moved) {
            return;
        }

        let { type } = this._moving;
        let { header } = this.props;

        switch (type) {
            case 'column':
            case 'row':
                this._grid.resizeHeaders({
                    behavior: 'manual',
                    headers: [{
                        type: type === 'row' ? HeaderType.Row : HeaderType.Column,
                        header: header,
                        size: header.$size + change
                    }]
                });
                break;

            case 'left-level':
            case 'top-level':
                let start = (
                    type === 'left-level'
                        ? this._container.getLeftLevelWidth(this._container.getLevel(header))
                        : this._container.getTopLevelHeight(this._container.getLevel(header))
                );
                this._grid.resizeHeaders({
                    behavior: 'manual',
                    levels: [{
                        type: type === 'left-level' ? HeaderType.Row : HeaderType.Column,
                        level: this._container.getLevel(header),
                        size: start + change
                    }]
                });
                break;
        }
    }

    private _onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        this._moved = false;

        e.preventDefault();

        if (e.button !== 0) {
            return;
        }

        let type = e.currentTarget.getAttribute('x-type') as ('r' | 'b');
        let p = type === 'r' ? e.pageX : e.pageY;
        let headerType = this._container.getHeaderType(this.props.header);
        let isRow = headerType === HeaderType.Row;

        this._unbind();

        let now = Date.now();
        let movingType = (
            type === 'r'
                ? isRow
                    ? 'left-level'
                    : 'column'
                : isRow
                    ? 'row'
                    : 'top-level'
        );

        if (this._lastClick && this._lastClick.type === movingType && (now - this._lastClick.time < 500)) {
            this._grid.previewResizeHeader(null);
            this._grid.previewResizeLevel(null);
            this._unbind();

            const workType = (
                movingType === 'column' || movingType === 'row'
                    ? 'cells'
                    : 'headers'
            );

            this._grid.autoMeasure([this.props.header], workType);
            return;
        }

        this._moving = {
            type: movingType as any,
            start: p
        };

        this._lastClick = {
            type: movingType as any,
            time: now
        };

        let change = 0;

        window.addEventListener('mouseup', this._upListener = () => {
            this._onChange(change);

            this._moved = false;

            this._grid.previewResizeHeader(null);
            this._grid.previewResizeLevel(null);
            this._unbind();
        });

        window.addEventListener('keydown', this._escListener = (ev: KeyboardEvent) => {
            if (ev.keyCode === 27) { // esc
                this._unbind();
            }
        });

        document.body.addEventListener('mousemove', this._moveListener = (ev: MouseEvent) => {
            if (!this._moving) {
                return;
            }

            this._moved = true;

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
                    x-type="r"
                    style={Resizer._r}
                    onMouseDown={this._onMouseDown}
                />
                <div
                    x-type="b"
                    style={Resizer._b}
                    onMouseDown={this._onMouseDown}
                />
            </>
        );
    }
}
