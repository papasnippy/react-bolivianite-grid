import * as React from 'react';

export class SizeView extends React.Component<React.HTMLProps<HTMLDivElement>, any> {
    state = {
        width: 0,
        height: 0
    };

    private _r: HTMLDivElement;
    private _t: any = null;

    constructor(p: any, c: any) {
        super(p, c);
        this._onRef = this._onRef.bind(this);
    }

    private _onRef = (r: HTMLDivElement) => {
        this._r = r;
    }

    public componentDidMount() {
        this._t = setInterval(() => {
            const { clientWidth, clientHeight } = this._r;
            if (this.state.width !== clientWidth || this.state.height !== clientHeight) {
                this.setState({ width: clientWidth, height: clientHeight });
            }
        }, 100);
    }

    public componentWillUnmount() {
        clearInterval(this._t);
    }

    public render() {
        const { width, height } = this.state;

        let jsx: JSX.Element = null;

        if (typeof this.props.children === 'function') {
            jsx = this.props.children({ width, height });
        } else {
            jsx = React.cloneElement(React.Children.only(this.props.children), { width, height });
        }

        return (
            <div
                {...this.props}
                ref={this._onRef}
            >
                {jsx}
            </div>
        );
    }
}

export default SizeView;
