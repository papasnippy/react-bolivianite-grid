import * as React from 'react';
import * as classnames from 'classnames';
import { RenderThrottler } from 'react-bolivianite-grid/controllers/renderthrottler';
const Style = require('./split-view.scss');

export interface ISplitViewProps {
    className?: string;
    minimum?: number;
}

export class SplitView extends React.PureComponent<ISplitViewProps, any> {
    state = {
        position: 0.5,
        initial: 0.5,
        drag: false,
        x: 0
    };

    private _mounted = false;
    private _t: RenderThrottler = null;
    private _r: HTMLDivElement = null;
    private _mouseup: EventListener = null;
    private _mousemove: EventListener = null;

    private _onRef = (r: HTMLDivElement) => {
        this._r = r;
    }

    public componentDidMount() {
        this._mounted = true;
        this._t = new RenderThrottler();

        const throttle = this._t.create();

        window.addEventListener('mouseup', this._mouseup = () => {
            if (!this._mounted) {
                return;
            }

            this.setState({ drag: false });
        });

        window.addEventListener('mousemove', this._mousemove = (e: MouseEvent) => {
            throttle(() => {
                if (!this.state.drag || !this._r || !this._mounted) {
                    return;
                }

                let width = this._r.clientWidth;
                let initialPosition = width * this.state.initial;
                let nextPosition = initialPosition + e.pageX - this.state.x;
                let minimum = this.props.minimum || 100;
                nextPosition = Math.max(minimum, Math.min(nextPosition, width - minimum));

                this.setState({
                    position: nextPosition / width
                });
            });
        });
    }

    public componentWillUnmount() {
        this._mounted = false;
        window.removeEventListener('mouseup', this._mouseup);
        window.removeEventListener('mousemove', this._mousemove);
    }

    public render() {
        let a = React.Children.toArray(this.props.children);

        if (a.length < 2) {
            return (
                <div className={classnames(Style.root, this.props.className)}>
                    <div className={Style.container} >
                        {a[0]}
                    </div>
                </div>
            );
        }

        return (
            <div
                className={classnames(Style.root, this.props.className)}
                ref={this._onRef}
            >
                <div
                    className={Style.container}
                    style={{
                        width: `${100 * this.state.position}%`
                    }}
                >
                    {a[0]}
                </div>
                <div
                    className={Style.resizer}
                    style={{
                        left: `${100 * this.state.position}%`
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        this.setState({
                            drag: true,
                            x: e.pageX,
                            initial: this.state.position
                        });
                    }}
                />
                <div
                    className={Style.container}
                    style={{
                        width: `${100 * (1 - this.state.position)}%`
                    }}
                >
                    {a[1]}
                </div>
            </div>
        );
    }
}

