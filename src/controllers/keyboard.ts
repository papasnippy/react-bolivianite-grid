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
}

export interface IKeyboardControllerUpdateSelectionEvent {
    active?: IGridAddress;
    selection?: IGridSelection[];
}

export interface IKeyboardControllerProps {
    getState: () => IState;
    onScroll: (cell: IGridAddress) => void;
    onUpdateSelection: (next: IKeyboardControllerUpdateSelectionEvent) => void;
    onCloseEditor: (commit: boolean, onClosed?: () => void) => void;
    onOpenEditor: (next: IGridAddress) => void;
}

export class KeyboardController {
    protected _state: IState = null;

    constructor(protected _props: IKeyboardControllerProps) {}

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

    private _onArrows(e: KeyboardEvent<HTMLDivElement>) {
        const { shiftKey, cmdKey } = this._getModifiers(e);
        const { active, rows, columns, selection } = this._state;

        let nextScroll: IGridAddress = null;
        let nextActive: IGridAddress = null;
        let nextSelection: IGridSelection[] = null;

        if (shiftKey && cmdKey) {
            let { prev, last } = this._splitSelection(selection);
            let next: IGridSelection = null;

            switch (e.keyCode) {
                case 37: // left
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

                case 38: // up
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

                case 39: // right
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

                case 40: // down
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
            switch (e.keyCode) {
                case 37: // left
                    nextActive = this._clampAddress({ row: active.row, column: 0 });
                    break;

                case 38: // up
                    nextActive = this._clampAddress({ row: 0, column: active.column });
                    break;

                case 39: // right
                    nextActive = this._clampAddress({ row: active.row, column: columns - 1 });
                    break;

                case 40: // down
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

            switch (e.keyCode) {
                case 37: // left
                    if (last.column + last.width === active.column) {
                        if (last.column) {
                            next = {
                                ...last,
                                column: last.column - 1,
                                width: last.width + 1
                            };
                            nextScroll = {
                                column: next.column,
                                row: null
                            };
                        }
                    } else if (last.width) {
                        next = {
                            ...last,
                            column: last.column,
                            width: last.width - 1
                        };
                        nextScroll = {
                            column: next.column + last.width - 1,
                            row: null
                        };
                    }
                    break;

                case 38: // up
                    if (last.row + last.height === active.row) {
                        if (last.row) {
                            next = {
                                ...last,
                                row: last.row - 1,
                                height: last.height + 1
                            };
                            nextScroll = {
                                column: null,
                                row: next.row
                            };
                        }
                    } else if (last.height) {
                        next = {
                            ...last,
                            row: last.row,
                            height: last.height - 1
                        };
                        nextScroll = {
                            column: null,
                            row: next.row + last.height - 1
                        };
                    }
                    break;

                case 39: // right
                    if (last.column === active.column) {
                        if (last.column + last.width < columns - 1) {
                            next = {
                                ...last,
                                width: last.width + 1
                            };
                            nextScroll = {
                                column: next.column + next.width,
                                row: null
                            };
                        }
                    } else if (last.width) {
                        next = {
                            ...last,
                            column: last.column + 1,
                            width: last.width - 1
                        };
                        nextScroll = {
                            column: next.column,
                            row: null
                        };
                    }
                    break;

                case 40: // down
                    if (last.row === active.row) {
                        if (last.row + last.height < rows - 1) {
                            next = {
                                ...last,
                                height: last.height + 1
                            };
                            nextScroll = {
                                column: null,
                                row: next.row + next.height
                            };
                        }
                    } else if (last.height) {
                        next = {
                            ...last,
                            row: last.row + 1,
                            height: last.height - 1
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
            switch (e.keyCode) {
                case 37: // left
                    nextActive = this._clampAddress({ row: active.row, column: active.column - 1 });
                    break;

                case 38: // up
                    nextActive = this._clampAddress({ row: active.row - 1, column: active.column });
                    break;

                case 39: // right
                    nextActive = this._clampAddress({ row: active.row, column: active.column + 1 });
                    break;

                case 40: // down
                    nextActive = this._clampAddress({ row: active.row + 1, column: active.column });
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

    public keydown(e: KeyboardEvent<HTMLDivElement>) {
        const { editor, active, focused, rows, columns } = this._state = this._props.getState();

        if (!rows || !columns) {
            return;
        }

        if (editor) {
            switch (e.keyCode) {
                case 9: // tab
                    this._props.onCloseEditor(true, () => {
                    });
                    break;

                case 13: // enter
                    this._props.onCloseEditor(true, () => {
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
                break;

            case 13: // enter
                break;

            case 32: // space
                break;

            case 33: // page up
            case 34: // page down
                break;

            case 35: // end
            case 36: // home
                break;

            case 37: // left
            case 38: // up
            case 39: // right
            case 40: // down
                this._onArrows(e);
                break;

            case 45: // insert
                break;

            case 46: // delete
                break;

            case 67: // c
                break;

            case 86: // v
                break;
        }
    }
}
