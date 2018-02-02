export interface IGridSelection {
    row: number;
    column: number;
    width: number;
    height: number;
}

export interface IGridAddress {
    row: number;
    column: number;
}

export interface IGridView {
    firstRow: number;
    lastRow: number;
    firstColumn: number;
    lastColumn: number;
    rowsHeight: number;
    columnsWidth: number;
}

export interface IGridOverscan {
    firstRow: number;
    lastRow: number;
    firstColumn: number;
    lastColumn: number;
}

export enum HeaderType {
    Row = 1,
    Column
}
