import { KeyboardEvent } from 'react';
import { IGridAddress, IGridSelection, IGridView } from '../types';

const IS_MACOS = navigator.platform.slice(0, 3) === 'Mac';

export interface IState {
    focused: boolean;
    editor: IGridAddress;
    active: IGridAddress;
    selection: IGridSelection[];
    view: IGridView;
    rows: number;
    columns: number;
    readOnly: boolean;
}

export interface IKeyboardControllerUpdateSelectionEvent {
    active?: IGridAddress;
    selection?: IGridSelection[];
}

export interface IKeyboardControllerRemoveEvent {
    rows: number[];
    columns: number[];
}

export interface IKeyboardControllerProps {
    getState: () => IState;
    onScroll: (cell: IGridAddress) => void;
    onUpdateSelection: (next: IKeyboardControllerUpdateSelectionEvent) => void;
    onCloseEditor: (commit: boolean, onClosed?: () => void) => void;
    onOpenEditor: (next: IGridAddress) => void;
    onNullify: (cells: IGridAddress[]) => void;
    onRemove: (props: IKeyboardControllerRemoveEvent) => void;
    onSpace: (cells: IGridAddress[]) => void;
    onCopy: (cells: IGridAddress[], withHeaders: boolean) => void;
    onPaste: (text: string) => void;
}

export class KeyboardController {
    protected _state: IState = null;
    protected _onPasteListener: any;

    constructor(protected _props: IKeyboardControllerProps) {
        document.body.addEventListener('paste', this._onPasteListener = (e: ClipboardEvent) => {
            const { focused, readOnly } = this._props.getState();

            if (!focused || readOnly) {
                return;
            }

            this._props.onPaste(e.clipboardData.getData('text/plain'));
        });
    }

    private _getModifiers(e: KeyboardEvent<HTMLDivElement>) {
        const { ctrlKey, altKey, shiftKey } = e;
        const cmdKey = e.getModifierState('Meta'); // Command key for Mac OS

        return {
            ctrlKey,
            macCmdKey: cmdKey,
            cmdKey: IS_MACOS ? cmdKey : ctrlKey,
            shiftKey,
            altKey
        };
    }

    private _isInput(e: KeyboardEvent<HTMLDivElement>) {
        const { keyCode } = e;
        const { ctrlKey, altKey, macCmdKey } = this._getModifiers(e);

        if (ctrlKey || altKey || macCmdKey) {
            return false;
        }

        return (
            (48 <= keyCode && keyCode <= 57) ||
            (65 <= keyCode && keyCode <= 90) ||
            (96 <= keyCode && keyCode <= 111) ||
            (186 <= keyCode && keyCode <= 222)
        );
    }

    private _clampAddress({ column, row }: IGridAddress) {
        const { rows, columns } = this._state;
        return {
            column: Math.min(Math.max(0, column), columns - 1),
            row: Math.min(Math.max(0, row), rows - 1)
        } as IGridAddress;
    }

    private _splitSelection(selection: IGridSelection[]) {
        let prev = selection.slice();
        let last = prev.pop();

        return {
            prev, last
        };
    }

    private _getSelectedCells(selection: IGridSelection[]) {
        let map: {
            [key: string]: IGridAddress;
        } = {};

        for (const { column, row, height, width } of selection) {
            for (let r = row, rLast = row + height; r <= rLast; r++) {
                for (let c = column, cLast = column + width; c <= cLast; c++) {
                    let key = `${r}x${c}`;

                    if (map[key]) {
                        continue;
                    }

                    map[key] = { row: r, column: c };
                }
            }
        }

        return Object.keys(map).sort().map(k => map[k]);
    }

    private _moveSelection(shiftKey: boolean, cmdKey: boolean, direction: 'left' | 'up' | 'right' | 'down', distance: number) {
        const { active, rows, columns, selection } = this._state;

        let nextScroll: IGridAddress = null;
        let nextActive: IGridAddress = null;
        let nextSelection: IGridSelection[] = null;

        if (shiftKey && cmdKey) {
            let { prev, last } = this._splitSelection(selection);
            let next: IGridSelection = null;

            switch (direction) {
                case 'left':
                    next = {
                        ...last,
                        column: 0,
                        width: active.column
                    };
                    nextScroll = {
                        row: null,
                        column: 0
                    };
                    break;

                case 'up':
                    next = {
                        ...last,
                        row: 0,
                        height: active.row
                    };
                    nextScroll = {
                        row: 0,
                        column: null
                    };
                    break;

                case 'right':
                    next = {
                        ...last,
                        column: active.column,
                        width: columns - active.column - 1
                    };
                    nextScroll = {
                        row: null,
                        column: columns - 1
                    };
                    break;

                case 'down':
                    next = {
                        ...last,
                        row: active.row,
                        height: rows - active.row - 1
                    };
                    nextScroll = {
                        row: rows - 1,
                        column: null
                    };
                    break;
            }

            if (next) {
                nextSelection = [
                    ...prev,
                    next
                ];
            }
        } else if (cmdKey) {
            switch (direction) {
                case 'left':
                    nextActive = this._clampAddress({ row: active.row, column: 0 });
                    break;

                case 'up':
                    nextActive = this._clampAddress({ row: 0, column: active.column });
                    break;

                case 'right':
                    nextActive = this._clampAddress({ row: active.row, column: columns - 1 });
                    break;

                case 'down':
                    nextActive = this._clampAddress({ row: rows - 1, column: active.column });
                    break;
            }

            nextScroll = nextActive;

            nextSelection = [{
                ...nextActive,
                width: 0,
                height: 0
            }];
        } else if (shiftKey) {
            let { prev, last } = this._splitSelection(selection);
            let next: IGridSelection = null;
            let delta = distance;

            switch (direction) {
                case 'left':
                    if (last.column + last.width === active.column) {
                        if (last.column) {
                            let newColumn = last.column - distance;

                            if (newColumn < 0) {
                                delta = distance + newColumn;
                                newColumn = 0;
                            }

                            next = {
                                ...last,
                                column: newColumn,
                                width: last.width + delta
                            };

                            nextScroll = {
                                column: next.column,
                                row: null
                            };
                        }
                    } else if (last.width) {
                        let newWidth = last.width - distance;

                        if (newWidth < 0) {
                            delta = distance + newWidth;
                            newWidth = 0;
                        }

                        next = {
                            ...last,
                            column: last.column,
                            width: newWidth
                        };

                        nextScroll = {
                            column: next.column + last.width - delta,
                            row: null
                        };
                    }
                    break;

                case 'up':
                    if (last.row + last.height === active.row) {
                        if (last.row) {
                            let newRow = last.row - distance;

                            if (newRow < 0) {
                                delta = distance + newRow;
                                newRow = 0;
                            }

                            next = {
                                ...last,
                                row: newRow,
                                height: last.height + delta
                            };

                            nextScroll = {
                                column: null,
                                row: next.row
                            };
                        }
                    } else if (last.height) {
                        let newHeight = last.height - distance;

                        if (newHeight < 0) {
                            delta = distance + newHeight;
                            newHeight = 0;
                        }

                        next = {
                            ...last,
                            row: last.row,
                            height: newHeight
                        };

                        nextScroll = {
                            column: null,
                            row: next.row + last.height - delta
                        };
                    }
                    break;

                case 'right':
                    if (last.column === active.column) {
                        if (last.column + last.width < columns - 1) {
                            if (last.width + distance > columns - 1) {
                                delta = last.width + distance - columns - 1;
                            }

                            next = {
                                ...last,
                                width: last.width + delta
                            };

                            nextScroll = {
                                column: next.column + next.width,
                                row: null
                            };
                        }
                    } else if (last.width) {
                        if (last.column + delta > active.column) {
                            delta = active.column - last.column;
                        }

                        next = {
                            ...last,
                            column: last.column + delta,
                            width: last.width - delta
                        };

                        nextScroll = {
                            column: next.column,
                            row: null
                        };
                    }
                    break;

                case 'down':
                    if (last.row === active.row) {
                        if (last.row + last.height < rows - 1) {
                            if (last.height + distance > rows - 1) {
                                delta = last.height + distance - rows - 1;
                            }

                            next = {
                                ...last,
                                height: last.height + delta
                            };

                            nextScroll = {
                                column: null,
                                row: next.row + next.height
                            };
                        }
                    } else if (last.height) {
                        if (last.row + delta > active.row) {
                            delta = active.row - last.row;
                        }

                        next = {
                            ...last,
                            row: last.row + delta,
                            height: last.height - delta
                        };
                        nextScroll = {
                            column: null,
                            row: next.row
                        };
                    }
                    break;
            }

            if (next) {
                nextSelection = [
                    ...prev,
                    next
                ];
            }
        } else {
            switch (direction) {
                case 'left':
                    nextActive = this._clampAddress({ row: active.row, column: active.column - distance });
                    break;

                case 'up':
                    nextActive = this._clampAddress({ row: active.row - distance, column: active.column });
                    break;

                case 'right':
                    nextActive = this._clampAddress({ row: active.row, column: active.column + distance });
                    break;

                case 'down':
                    nextActive = this._clampAddress({ row: active.row + distance, column: active.column });
                    break;
            }

            nextScroll = nextActive;

            nextSelection = [{
                ...nextActive,
                width: 0,
                height: 0
            }];
        }

        if (nextActive || nextSelection) {
            this._props.onUpdateSelection({
                active: nextActive,
                selection: nextSelection
            });
        }

        if (nextScroll) {
            this._props.onScroll(nextScroll);
        }
    }

    private _onTab(e: KeyboardEvent<HTMLDivElement>) {
        e.preventDefault();

        const { shiftKey, cmdKey } = this._getModifiers(e);
        let { active, rows, columns, selection } = this._state;

        if (cmdKey) {
            return;
        }

        let { last } = this._splitSelection(selection);
        let firstRow = 0;
        let firstColumn = 0;
        let lastRow = rows - 1;
        let lastColumn = columns - 1;
        let insideSelection = false;
        active = { ...active };

        if (last.height || last.width) {
            insideSelection = true;
            firstRow = last.row;
            firstColumn = last.column;
            lastRow = firstRow + last.height;
            lastColumn = firstColumn + last.width;
        }

        if (shiftKey) {
            active.column--;
            if (active.column < firstColumn) {
                active.column = lastColumn;
                active.row--;
            }

            if (active.row < firstRow) {
                active.row = lastRow;
            }
        } else {
            active.column++;

            if (active.column > lastColumn) {
                active.column = firstColumn;
                active.row++;
            }

            if (active.row > lastRow) {
                active.row = firstRow;
            }
        }

        this._props.onUpdateSelection({
            active: active,
            selection: (
                insideSelection
                    ? null
                    : [{ ...active, height: 0, width: 0 }]
            )
        });

        this._props.onScroll(active);
    }

    private _onEnter(e: KeyboardEvent<HTMLDivElement>) {
        e.preventDefault();

        const { shiftKey, cmdKey } = this._getModifiers(e);
        let { active, rows, selection } = this._state;

        if (cmdKey) {
            this._props.onOpenEditor(active);
            return;
        }

        let { last } = this._splitSelection(selection);
        let firstRow = 0;
        let firstColumn = active.column;
        let lastRow = rows - 1;
        let lastColumn = active.column;
        let insideSelection = false;
        active = { ...active };

        if (last.height || last.width) {
            insideSelection = true;
            firstRow = last.row;
            firstColumn = last.column;
            lastRow = firstRow + last.height;
            lastColumn = firstColumn + last.width;
        }

        if (shiftKey) {
            active.row--;

            if (insideSelection) {
                if (active.row < firstRow) {
                    active.row = lastRow;
                    active.column--;
                }

                if (active.column < firstColumn) {
                    active.column = lastColumn;
                }
            } else if (active.row < 0) {
                active.row = 0;
            }
        } else {
            active.row++;

            if (insideSelection) {
                if (active.row > lastRow) {
                    active.row = firstRow;
                    active.column++;
                }

                if (active.column > lastColumn) {
                    active.column = firstColumn;
                }
            } else if (active.row > rows - 1) {
                active.row = rows - 1;
            }
        }

        this._props.onUpdateSelection({
            active: active,
            selection: (
                insideSelection
                    ? null
                    : [{ ...active, height: 0, width: 0 }]
            )
        });

        this._props.onScroll(active);
    }

    private _onSpace(e: KeyboardEvent<HTMLDivElement>) {
        e.preventDefault();
        const cells = this._getSelectedCells(this._state.selection);
        this._props.onSpace(cells);
    }

    private _onPageUpDown(e: KeyboardEvent<HTMLDivElement>) {
        e.preventDefault();

        const { shiftKey, cmdKey, altKey } = this._getModifiers(e);
        let { view } = this._state;
        let direction: 'left' | 'right' | 'up' | 'down' = (
            e.keyCode === 33
                ? altKey
                    ? 'left'
                    : 'up'
                : altKey
                    ? 'right'
                    : 'down'
        );

        let pageColumns = view.lastColumn - view.firstColumn;
        let pageRows = view.lastRow - view.firstRow;


        switch (e.keyCode) {
            case 37: direction = 'left'; break;
            case 38: direction = 'up'; break;
            case 39: direction = 'right'; break;
            case 40: direction = 'down'; break;
        }

        this._moveSelection(shiftKey, cmdKey, direction, altKey ? pageColumns : pageRows);
    }

    private _onHomeEnd(e: KeyboardEvent<HTMLDivElement>) {
        const { shiftKey, cmdKey, altKey } = this._getModifiers(e);

        if (altKey) {
            return;
        }

        e.preventDefault();

        let direction: 'home' | 'end' = e.keyCode === 36 ? 'home' : 'end';
        let { active, rows, columns, selection } = this._state;
        let nextActive: IGridAddress = null;
        let nextSelection: IGridSelection[] = null;

        let nextScroll: IGridAddress = {
            row: cmdKey ? direction === 'home' ? 0 : (rows - 1) : active.row,
            column: direction === 'home' ? 0 : (columns - 1)
        };

        if (shiftKey) {
            let { prev } = this._splitSelection(selection);

            nextSelection = [
                ...prev,
                {
                    row: cmdKey && direction === 'home' ? 0 : active.row,
                    column: direction === 'home' ? 0 : active.column,
                    height: cmdKey ? (direction === 'home' ? active.row : rows - active.row - 1) : 0,
                    width: direction === 'home' ? active.column : columns - active.column - 1
                }
            ];
        } else {
            nextActive = nextScroll;
            nextSelection = [{ ...nextActive, width: 0, height: 0 }];
        }

        this._props.onUpdateSelection({
            active: nextActive,
            selection: nextSelection
        });

        this._props.onScroll(nextScroll);
    }

    private _onArrows(e: KeyboardEvent<HTMLDivElement>) {
        e.preventDefault();

        const { shiftKey, cmdKey } = this._getModifiers(e);
        let direction: 'left' | 'up' | 'down' | 'right';

        switch (e.keyCode) {
            case 37: direction = 'left'; break;
            case 38: direction = 'up'; break;
            case 39: direction = 'right'; break;
            case 40: direction = 'down'; break;
        }

        this._moveSelection(shiftKey, cmdKey, direction, 1);
    }

    private _onCopy(withHeaders: boolean) {
        const cells = this._getSelectedCells(this._state.selection);
        this._props.onCopy(cells, withHeaders);
    }

    private _onNullify() {
        if (this._state.readOnly) {
            return;
        }

        const cells = this._getSelectedCells(this._state.selection);
        this._props.onNullify(cells);
    }

    private _onRemove() {
        if (this._state.readOnly) {
            return;
        }

        let rowMap: { [row: number]: boolean } = {};
        let colMap: { [col: number]: boolean } = {};

        this._getSelectedCells(this._state.selection).forEach(({ column, row }) => {
            if (!rowMap[row]) {
                rowMap[row] = true;
            }

            if (!colMap[column]) {
                colMap[row] = true;
            }
        });

        this._props.onRemove({
            rows: Object.keys(rowMap).map(Number).sort(),
            columns: Object.keys(colMap).map(Number).sort()
        });
    }

    private _onData(e: KeyboardEvent<HTMLDivElement>) {
        const { cmdKey, altKey, shiftKey } = this._getModifiers(e);

        switch (e.keyCode) {
            case 45: // insert
                if (!shiftKey && !cmdKey) {
                    break;
                }

                if (shiftKey && !cmdKey) {
                    // this._onPaste();
                } else if (!shiftKey && cmdKey) {
                    e.preventDefault();
                    this._onCopy(altKey);
                }
                break;

            case 8: // backspace
            case 46: // delete
                e.preventDefault();
                if (shiftKey && !cmdKey) {
                    this._onCopy(false);
                    this._onNullify();
                } else if (!shiftKey && cmdKey) {
                    this._onRemove();
                } else if (!shiftKey && !cmdKey) {
                    this._onNullify();
                }
                break;

            case 67: // c
                if (!cmdKey) {
                    break;
                }
                e.preventDefault();
                this._onCopy(altKey);
                break;

            case 86: // v
                if (!cmdKey) {
                    break;
                }

                // this._onPaste();
                break;

            case 88: // x
                if (!cmdKey) {
                    break;
                }
                e.preventDefault();
                this._onCopy(false);
                this._onNullify();
                break;
        }
    }

    public keydown(e: KeyboardEvent<HTMLDivElement>) {
        const { editor, active, focused, rows, columns } = this._state = this._props.getState();

        if (!rows || !columns) {
            return;
        }

        if (editor) {
            switch (e.keyCode) {
                case 9: // tab
                    this._props.onCloseEditor(true, () => {
                        this._onTab(e);
                    });
                    break;

                case 13: // enter
                    this._props.onCloseEditor(true, () => {
                        this._onEnter(e);
                    });
                    break;

                case 27: // esc
                    this._props.onCloseEditor(false);
                    break;
            }
            return;
        }

        if (!focused) {
            return;
        }

        if (this._isInput(e)) {
            this._props.onOpenEditor(active);
            return;
        }

        switch (e.keyCode) {
            case 9: // tab
                this._onTab(e);
                break;

            case 13: // enter
                this._onEnter(e);
                break;

            case 32: // space
                this._onSpace(e);
                break;

            case 33: // page up
            case 34: // page down
                this._onPageUpDown(e);
                break;

            case 35: // end
            case 36: // home
                this._onHomeEnd(e);
                break;

            case 37: // left
            case 38: // up
            case 39: // right
            case 40: // down
                this._onArrows(e);
                break;

            case 8: // backspace
            case 45: // insert
            case 46: // delete
            case 67: // c
            case 86: // v
            case 88: // x
                this._onData(e);
                break;
        }
    }

    public dispose() {
        document.body.removeEventListener('paste', this._onPasteListener);
    }
}
