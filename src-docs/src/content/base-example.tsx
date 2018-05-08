import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HeadersContainer } from 'react-bolivianite-grid';
const Style = require('./style.scss');
const IS_MACOS = navigator.platform.slice(0, 3) === 'Mac';

const PATH_UNDO = (
    'M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 ' +
    '5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z'
);

const PATH_REDO = (
    'M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 ' +
    '16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z'
);

export interface HistoryState {
    data?: {
        [key: string]: string;
    };
    headers?: HeadersContainer;
}

export interface IBaseExampleProps {
    /** Provided by example wrapper component. Ignore this. */
    refControls?: HTMLElement;
}

export class BaseExample extends React.Component<IBaseExampleProps, any> {
    private _isMounted = true;

    state = this.getInitialState();

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

    getInitialState() {
        return {
            history: [{
                data: {} as {
                    [key: string]: string;
                },
                headers: new HeadersContainer({
                    columns: new Array(100).fill(null).map(() => ({})),
                    rows: new Array(200).fill(null).map(() => ({})),
                    columnWidth: 100,
                    rowHeight: 24,
                    headersHeight: 24,
                    headersWidth: 50
                })
            } as HistoryState],
            index: 0,
            input: ''
        };
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

    excelIndex(index: number) {
        index++;
        let c = '';

        for (let a = 1, b = 26; (index -= a) >= 0; a = b, b *= 26) {
            c = String.fromCharCode(~~((index % b) / a) + 65) + c;
        }

        return c;
    }

    renderGrid(): JSX.Element {
        return null;
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

export default BaseExample;
