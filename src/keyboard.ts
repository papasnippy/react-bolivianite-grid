import { IGridAddress, IGridSelection, IGridView } from './types';

export interface IKeyboardControllerProps {
    getFocused: () => boolean;
    getEditing: () => boolean;
    getActive: () => IGridAddress;
    getSelections: () => IGridSelection[];
    getView: () => IGridView;
    getDataSize: () => { rows: number; columns: number; };
}

export class KeyboardController {
    constructor(private _props: IKeyboardControllerProps) {
    }
}
