import { MouseEvent } from 'react';
import { IGridAddress } from '../components';
import { HeaderType } from '../models';
import { Controller, IControllerProps } from './controller';

export interface IMouseControllerProps extends IControllerProps {
    onRightClick: (cell: IGridAddress, event: React.MouseEvent<HTMLElement>) => void;
}

export class MouseController extends Controller {
    protected _lastMouseDown = {
        time: 0,
        row: -1,
        column: -1
    };
    protected _down: {
        row: number;
        column: number;
    } = null;
    protected _scrollBySelect: { h: 'L' | 'R', v: 'T' | 'B' } = null;
    protected _scrollTask: any = null;

    constructor(protected _props: IMouseControllerProps) {
        super(_props);
        window.addEventListener('mouseup', this._mouseup);
    }

    protected _mouseSelectFromActive(row: number, column: number) {
        let { selection, active } = this._state;
        let { prev } = this._splitSelection(selection);
        let last = { row, column, width: 0, height: 0 };

        if (column <= active.column) {
            last.width = active.column - column;
        } else {
            last.column = active.column;
            last.width = column - active.column;
        }

        if (row <= active.row) {
            last.height = active.row - row;
        } else {
            last.row = active.row;
            last.height = row - active.row;
        }

        this._props.onUpdateSelection({
            selection: [
                ...prev,
                last
            ]
        });
    }

    protected _autoscroll = () => {
        if (!this._scrollBySelect) {
            return;
        }

        let { rows, columns, view } = this._request();
        let { h, v } = this._scrollBySelect;
        let scroll = {
            row: null as number,
            column: null as number
        };

        if (h === 'L') {
            if (view.firstColumn) {
                scroll.column = view.firstColumn - 1;
            }
        } else if (h === 'R') {
            if (view.lastColumn !== columns - 1) {
                scroll.column = view.lastColumn + 1;
            }
        }

        if (v === 'T') {
            if (view.firstRow) {
                scroll.row = view.firstRow - 1;
            }
        } else if (v === 'B') {
            if (view.lastRow !== rows - 1) {
                scroll.row = view.lastRow + 1;
            }
        }

        this._props.onScroll(scroll);
    }

    protected _mouseup = () => {
        this._down = null;
        this.rootenter();
    }

    public rootleave(x: number, y: number, rect: ClientRect) {
        if (!this._down) {
            return;
        }

        this._request();

        this._scrollBySelect = {
            h: null,
            v: null
        };

        console.log(x, y, rect);

        if (x <= rect.left) {
            this._scrollBySelect.h = 'L';
        } else if (x >= rect.left + rect.width) {
            this._scrollBySelect.h = 'R';
        }

        if (y <= rect.top) {
            this._scrollBySelect.v = 'T';
        } else if (y >= rect.top + rect.height) {
            this._scrollBySelect.v = 'B';
        }

        this._scrollTask = setInterval(this._autoscroll, 50);
    }

    public rootenter() {
        if (this._scrollTask) {
            clearInterval(this._scrollTask);
            this._scrollTask = null;
        }

        this._scrollBySelect = null;
    }

    public mouseenter(row: number, column: number) {
        if (!this._down) {
            return;
        }

        this._request();
        this._mouseSelectFromActive(row, column);
    }

    public headerdown(e: MouseEvent<HTMLElement>, type: HeaderType, first: number, last = first) {
        if (e.defaultPrevented) {
            return;
        }

        e.preventDefault();

        if (e.button !== 0) {
            return;
        }

        const { editor, rows, columns } = this._request();

        if (editor) {
            return;
        }

        let { shiftKey } = this._getModifiers(e);

        if (shiftKey) {

        } else {
            let active = {
                row: type === HeaderType.Column ? 0 : first,
                column: type === HeaderType.Column ? first : 0
            };

            this._props.onUpdateSelection({
                active,
                selection: [{
                    ...active,
                    height: type === HeaderType.Column ? rows - 1 : last - first,
                    width: type === HeaderType.Column ? last - first : columns - 1
                }]
            });
        }
    }

    public mousedown(e: MouseEvent<HTMLElement>, row: number, column: number) {
        const { selection, editor } = this._request();
        const { cmdKey, shiftKey } = this._getModifiers(e);

        const clickInEditor = editor && editor.row === row && editor.column === column;

        if (!clickInEditor && e.button !== 1) {
            e.preventDefault();
        }

        if (editor && !clickInEditor && e.button !== 1) {
            this._props.onCloseEditor(true);
        }

        if (!cmdKey && shiftKey && e.button === 0) {
            this._mouseSelectFromActive(row, column);
            this._down = { row, column };
        } else if (cmdKey && !shiftKey && e.button == 0) {
            this._props.onUpdateSelection({
                active: { row, column },
                selection: [
                    ...selection,
                    { row, column, height: 0, width: 0 }
                ]
            });
            this._down = { row, column };
        } else if (e.button === 0) {
            this._props.onUpdateSelection({
                active: { row, column },
                selection: [{ row, column, height: 0, width: 0 }]
            });

            let t = Date.now();
            let openEditor = (
                !clickInEditor &&
                t - this._lastMouseDown.time < 500 &&
                this._lastMouseDown.row === row &&
                this._lastMouseDown.column === column
            );

            this._lastMouseDown.time = t;
            this._lastMouseDown.row = row;
            this._lastMouseDown.column = column;

            if (openEditor) {
                this._down = null;
                if (editor) {
                    this._props.onCloseEditor(true, () => {
                        this._props.onOpenEditor({ row, column });
                    });
                } else {
                    this._props.onOpenEditor({ row, column });
                }
            } else {
                this._down = { row, column };
            }
        } else if (e.button === 2) {
            this._props.onUpdateSelection({
                active: { row, column },
                selection: [{ row, column, height: 0, width: 0 }]
            });

            try {
                e.persist();
                this._props.onRightClick({ row, column }, e);
            } catch (err) {
                console.log(err);
            }
        }
    }

    public dispose() {
        this.rootenter();
        window.removeEventListener('mouseup', this._mouseup);
    }
}
