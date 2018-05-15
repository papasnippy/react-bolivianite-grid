import * as React from 'react';

export interface EditorProps {
    initialValue: string;
    update: (v: any) => void;
}

export class Editor extends React.PureComponent<EditorProps, any> {
    state = {
        value: this.props.initialValue == null ? '' : this.props.initialValue
    };

    private _ref: HTMLInputElement;

    private _onRef = (r: any) => {
        this._ref = r;
    }

    public componentDidMount() {
        if (!this._ref) {
            return;
        }

        this._ref.focus();
        this._ref.select();
    }

    public componentWillUnmount() {
        if (this.state.value !== this.props.initialValue) {
            this.props.update(this.state.value);
        }
    }

    public render() {
        return (
            <input
                ref={this._onRef}
                style={{
                    width: '100%',
                    height: '100%',
                    padding: 0,
                    margin: 0,
                    border: 0,
                    background: 'transparent',
                    outline: 'none',
                    fontFamily: 'var(--app--font-family)',
                    fontSize: 'var(--app--font-size)'
                }}
                value={this.state.value}
                onChange={(e) => {
                    this.setState({ value: e.target.value });
                }}
            />
        );
    }
}

export default Editor;
