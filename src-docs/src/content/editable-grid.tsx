import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Grid, {
    HeaderRepository, IHeader, ICellRendererEvent, IHeaderRendererEvent,
    HeaderType, ISelectionRendererEvent, ICellEditorEvent,
    IGridNullifyEvent, IGridUpdateEvent
} from 'react-bolivianite-grid';

import Theme from './style';
import Editor from './simple-editor';

const Style = require('./style.scss');
const IS_MACOS = navigator.platform.slice(0, 3) === 'Mac';

/**
 * Material design icons
 * https://github.com/google/material-design-icons
 *
 * This icons will be used for undo and redo actions.
 */
const PATH_UNDO = (
    'M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 ' +
    '5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z'
);
const PATH_REDO = (
    'M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 ' +
    '16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z'
);

/** Current header repository and data set state. */
export interface HistoryState {
    data?: {
        [key: string]: string;
    };
    headers?: HeaderRepository;
}

export interface IBaseExampleProps {
    /** Provided by example wrapper component. We will place our undo/redo buttons here. */
    refControls?: HTMLElement;
}

export default class extends React.Component<IBaseExampleProps, any> {
    private _isMounted = true;

    state = {
        history: [{
            data: {} as {
                [key: string]: string;
            },
            headers: this.generateHeaders(200, 100)
        } as HistoryState],
        index: 0, // current history page
        input: '' // this property will be used in header filter example
    };

    /** Current header repository and data set. */
    get currentState() {
        return this.state.history[this.state.index];
    }

    get canUndo() {
        return this.state.index;
    }

    get canRedo() {
        const len = this.state.history.length;
        return len && this.state.index !== len - 1;
    }

    pushHistory(state: HistoryState, autosize = false) {
        if (!this._isMounted) {
            return;
        }

        let ix = this.state.index;
        let is = this.state.history[ix];
        let n = autosize ? 0 : 1;

        this.setState({
            index: ix + n,
            history: [
                ...this.state.history.slice(0, ix + n),
                {
                    ...is,
                    ...state
                }
            ]
        });
    }

    undo = () => {
        if (!this.state.index) {
            return;
        }

        this.setState({
            index: this.state.index - 1
        });
    }

    redo = () => {
        if (this.state.index === (this.state.history.length - 1)) {
            return;
        }

        this.setState({
            index: this.state.index + 1
        });
    }

    getModifiers(e: React.KeyboardEvent<HTMLElement>) {
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

    /** Managing undo/redo keyboard actions. */
    onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const { cmdKey, shiftKey } = this.getModifiers(e);
        const t = e.target as HTMLElement;

        if (!cmdKey || (t && t.tagName === 'INPUT')) {
            return;
        }

        switch (e.keyCode) {
            case 89: // Y
                if (!IS_MACOS) {
                    e.preventDefault();
                    this.redo();
                }
                break;

            case 90: // Z
                e.preventDefault();
                if (IS_MACOS && shiftKey) {
                    this.redo();
                } else {
                    this.undo();
                }
                break;
        }
    }

    /** We will use this in header filtering example. */
    renderAdditionalControls(): React.ReactNode {
        return null;
    }

    renderControls() {
        if (!this.props.refControls) {
            return null;
        }

        return ReactDOM.createPortal((
            <>
                <button
                    className={Style.historyButton}
                    onClick={this.undo}
                    disabled={!this.canUndo}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path d={PATH_UNDO} />
                    </svg>
                </button>
                <button
                    className={Style.historyButton}
                    onClick={this.redo}
                    disabled={!this.canRedo}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path d={PATH_REDO} />
                    </svg>
                </button>
                {this.renderAdditionalControls()}
            </>
        ), this.props.refControls);
    }

    /** Generating header reporitory. */
    generateHeaders(rows: number, columns: number) {
        const colHeaders = (
            new Array(columns)
                .fill(null)
                .map((_, i) => {
                    return {
                        colIndex: i
                    } as IHeader;
                })
        );

        const rowlHeaders = (
            new Array(rows)
                .fill(null)
                .map((_, i) => {
                    return {
                        rowIndex: i
                    } as IHeader;
                })
        );

        return new HeaderRepository({
            columns: colHeaders,
            rows: rowlHeaders,
            columnWidth: 100,
            rowHeight: 24,
            headersHeight: 24,
            headersWidth: 50
        });
    }

    /** Function to get data key, that associated by pair of headers. */
    getDataKey(row: IHeader | number, col: IHeader | number) {
        const { headers } = this.currentState;
        const r = typeof row === 'number' ? headers.rows[row].rowIndex : row.rowIndex;
        const c = typeof col === 'number' ? headers.columns[col].colIndex : col.colIndex;
        return `${r} x ${c}`;
    }

    /** Value getter. */
    getValue(rowHeader: IHeader, colHeader: IHeader, source: any) {
        const key = this.getDataKey(rowHeader, colHeader);
        return source[key] === void 0 ? key : source[key];
    }

    getHeaderCaption(header: IHeader, type: HeaderType) {
        if (header.caption) {
            return header.caption;
        }

        return (
            type === HeaderType.Column
                ? this.excelIndex(header.colIndex)
                : header.rowIndex
        );
    }

    excelIndex(index: number) {
        index++;
        let c = '';

        for (let a = 1, b = 26; (index -= a) >= 0; a = b, b *= 26) {
            c = String.fromCharCode(~~((index % b) / a) + 65) + c;
        }

        return c;
    }

    renderCell = ({ style, row, source, rowHeader, columnHeader, theme }: ICellRendererEvent) => {
        return (
            <div
                style={{
                    ...style,
                    ...theme.cellStyle,
                    background: row % 2 ? theme.cellBackgroundEven : theme.cellBackgroundOdd
                }}
            >
                {this.getValue(rowHeader, columnHeader, source )}
            </div>
        );
    }

    /** We will use this method later. */
    renderAdditionalHeaderContent(_e: IHeaderRendererEvent): React.ReactNode {
        return null;
    }

    renderHeader = (e: IHeaderRendererEvent) => {
        const { style, type, selection, theme, header } = e;
        const nextStyle: React.CSSProperties = {
            ...style,
            ...theme.headerStyle
        };

        switch (type) {
            case HeaderType.Row:
                nextStyle.borderBottomColor = theme.headerBorderColor;
                break;

            case HeaderType.Column:
                nextStyle.borderRightColor = theme.headerBorderColor;
                break;
        }

        if (selection) {
            nextStyle.background = theme.headerBackgroundColorSelected;
        }

        nextStyle.justifyContent = type === HeaderType.Row ? 'flex-end' : 'center';

        return (
            <div style={nextStyle}>
                {this.getHeaderCaption(header, type)}
                {this.renderAdditionalHeaderContent(e)}
            </div>
        );
    }

    renderSelection = ({ key, style, active, edit, theme }: ISelectionRendererEvent) => {
        // Modifying style size for proper border positioning.
        style.left = Number(style.left) - 1;
        style.top = Number(style.top) - 1;
        style.width = Number(style.width) + 1;
        style.height = Number(style.height) + 1;

        return (
            <div
                key={key}
                style={{
                    ...style,
                    boxSizing: 'border-box',
                    backgroundColor: (active || edit) ? theme.selectionBackgroundActive : theme.selectionBackground,
                    border: active ? theme.selectionBorderActive : theme.selectionBorder
                }}
            />
        );
    }

    editorRenderer = ({ style, update, source, theme, rowHeader, columnHeader }: ICellEditorEvent) => {
        let initialValue = this.getValue(rowHeader, columnHeader, source);

        return (
            <div
                style={{
                    ...style,
                    boxSizing: 'border-box',
                    borderRight: `solid 1px ${theme.editorBorderColor}`,
                    borderBottom: `solid 1px ${theme.editorBorderColor}`,
                    padding: '0 3px',
                    display: 'flex',
                    alignItems: 'center',
                    background: theme.editorBackground
                }}
            >
                <Editor
                    initialValue={initialValue}
                    update={update}
                />
            </div>
        );
    }

    /** Called when user press DELETE key. */
    onNullify = ({ cells }: IGridNullifyEvent) => {
        let data = {
            ...this.currentState.data
        };

        cells.forEach(({ column, row }) => {
            data[this.getDataKey(row, column)] = null;
        });

        this.pushHistory({ data });
    }

    onUpdate = ({ cell, value }: IGridUpdateEvent) => {
        let key = this.getDataKey(cell.row, cell.column);

        this.pushHistory({
            data: {
                ...this.currentState.data,
                [key]: value
            }
        });
    }

    renderGrid() {
        const { data, headers } = this.currentState;
        return (
            <Grid
                headers={headers}
                overscanRows={3}
                source={data}
                theme={Theme}
                onRenderCell={this.renderCell}
                onRenderHeader={this.renderHeader}
                onRenderSelection={this.renderSelection}
                onRenderEditor={this.editorRenderer}
                onNullify={this.onNullify}
                onUpdate={this.onUpdate}
            />
        );
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    render() {
        return (
            <div className={Style.exampleContainer} onKeyDown={this.onKeyDown}>
                {this.renderControls()}
                {this.renderGrid()}
            </div>
        );
    }
}
