import { MouseEvent } from 'react';
// import { IGridAddress, IGridSelection } from '../types';
import { Controller, IControllerProps } from './controller';

export interface IMouseControllerProps extends IControllerProps {
}

export class MouseController extends Controller {

    constructor(protected _props: IMouseControllerProps) {
        super(_props);
    }

    public mousedown(_e: MouseEvent<HTMLElement>, row: number, column: number) {
        this._props.onUpdateSelection({
            active: { row, column },
            selection: [{ row, column, height: 0, width: 0 }]
        });
    }

    public dispose() {
    }
}
