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
    rows: number;
    columns: number;
}

export interface IGridOverscan {
    firstRow: number;
    lastRow: number;
    firstColumn: number;
    lastColumn: number;
}
