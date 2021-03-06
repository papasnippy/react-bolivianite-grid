import { KeyboardEvent, MouseEvent } from 'react';
import { IGridAddress, IGridSelection, IGridView } from './types';

const IS_MACOS = navigator.platform.slice(0, 3) === 'Mac';

export interface IState {
    enabled: boolean;
    focused: boolean;
    editor: IGridAddress;
    active: IGridAddress;
    selection: IGridSelection[];
    view: IGridView;
    rows: number;
    columns: number;
    readOnly: boolean;
}

export interface IUpdateSelectionEvent {
    active?: IGridAddress;
    selection?: IGridSelection[];
}

export interface IControllerProps {
    getState: () => IState;
    onScroll: (cell: IGridAddress) => void;
    onUpdateSelection: (next: IUpdateSelectionEvent, callback?: () => void) => void;
    onCloseEditor: (commit: boolean, onClosed?: () => void) => void;
    onOpenEditor: (next: IGridAddress) => void;
}

export class Controller {
    protected _state: IState = null;

    constructor(protected _props: IControllerProps) { }

    protected _getModifiers(e: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>) {
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

    protected _clampAddress({ column, row }: IGridAddress) {
        const { rows, columns } = this._state;
        return {
            column: Math.min(Math.max(0, column), columns - 1),
            row: Math.min(Math.max(0, row), rows - 1)
        } as IGridAddress;
    }

    protected _splitSelection(selection: IGridSelection[]) {
        let prev = selection.slice();
        let last = prev.pop();

        return {
            prev, last
        };
    }

    protected _getSelectedCells(selection: IGridSelection[]) {
        let lock = new Set<string>();
        let list: IGridAddress[] = [];

        for (const { column, row, height, width } of selection) {
            for (let r = row, rLast = row + height; r <= rLast; r++) {
                for (let c = column, cLast = column + width; c <= cLast; c++) {
                    let key = `${r}x${c}`;

                    if (lock.has(key)) {
                        continue;
                    }

                    lock.add(key);
                    list.push({ row: r, column: c });
                }
            }
        }

        return list;
    }

    protected _isInsideSelection({ column: c, row: r }: IGridAddress, selection: IGridSelection[]) {
        return selection.findIndex(({ row, column, height, width }) => {
            return row <= r && r <= (row + height) && column <= c && c <= (column + width);
        }) !== -1;
    }

    protected _request() {
        return this._state = this._props.getState();
    }
}
