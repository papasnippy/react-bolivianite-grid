import { KeyboardEvent } from 'react';
import { IGridAddress, IGridSelection, IGridView } from '../types';

export interface IKeyboardControllerProps {
    getState: () => {
        focused: boolean;
        editor: IGridAddress;
        active: IGridAddress;
        selection: IGridSelection[];
        view: IGridView;
        rows: number;
        columns: number;
    };
    onUpdateSelection: (next: { active?: IGridAddress, selection?: IGridSelection[] }) => void;
    onCloseEditor: (commit: boolean, onClosed?: () => void) => void;
    onOpenEditor: (next: IGridAddress) => void;
}

export class KeyboardController {
    constructor(private _props: IKeyboardControllerProps) {
    }

    public keydown(e: KeyboardEvent<HTMLDivElement>) {

    }
}
