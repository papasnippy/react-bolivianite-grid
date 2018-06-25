import * as React from 'react';

export interface IScrollViewUpdateEvent {
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
}

export interface IScrollViewProps {
    className?: string;
    style?: React.CSSProperties;
    preserveScrollbars?: boolean;
    onScroll: (event: IScrollViewUpdateEvent) => void;
    bodyRenderer: (event: IScrollViewUpdateEvent) => React.ReactNode;
    headersRenderer: (event: IScrollViewUpdateEvent) => React.ReactNode;
}

export interface IScrollViewComponentInterface extends React.Component<IScrollViewProps, any> {
    scrollerStyle: CSSStyleDeclaration;
    scrollLeft: number;
    scrollTop: number;
}

export interface IScrollViewInterface extends React.StaticLifecycle<IScrollViewProps, any> {
    new (props: IScrollViewProps, context?: any): IScrollViewComponentInterface;
    propTypes?: React.ValidationMap<IScrollViewProps>;
    contextTypes?: React.ValidationMap<any>;
    childContextTypes?: React.ValidationMap<any>;
    defaultProps?: Partial<IScrollViewProps>;
    displayName?: string;
}

export class ScrollView extends React.Component<IScrollViewProps, any> implements IScrollViewComponentInterface {
    private _r: HTMLDivElement;
    private _taskResize: any = null;

    constructor(p: IScrollViewProps, c: any) {
        super(p, c);
    }

    public get scrollerStyle() {
        return this._r.style;
    }

    public get scrollLeft() {
        return this._r.scrollLeft;
    }

    public set scrollLeft(v) {
        this._r.scrollLeft = v;
    }

    public get scrollTop() {
        return this._r.scrollTop;
    }

    public set scrollTop(v) {
        this._r.scrollTop = v;
    }

    private _onRef = (r: HTMLDivElement) => {
        this._r = r;
    }

    private _onScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!this.props.onScroll || e && this._r !== e.target) {
            return;
        }

        // Calling forceUpdate to prevent browser freeze.
        this.forceUpdate(() => {
            if (this.props.onScroll) {
                this.props.onScroll(this._getView());
            }
        });
    }

    private _getView(): IScrollViewUpdateEvent {
        if (!this._r) {
            return {
                scrollLeft: 0,
                scrollTop: 0,
                scrollWidth: 0,
                scrollHeight: 0,
                clientWidth: 0,
                clientHeight: 0
            };
        }

        return {
            scrollLeft: this._r.scrollLeft,
            scrollTop: this._r.scrollTop,
            scrollWidth: this._r.scrollWidth,
            scrollHeight: this._r.scrollHeight,
            clientWidth: this._r.clientWidth,
            clientHeight: this._r.clientHeight
        };
    }

    public componentDidMount() {
        let w = this._r.clientWidth;
        let h = this._r.clientHeight;

        this._taskResize = setInterval(() => {
            let nw = this._r.clientWidth;
            let nh = this._r.clientHeight;

            if (nw !== w || nh !== h) {
                w = nw;
                h = nh;
                this._onScroll(null);
            }
        }, 100);

        if (this.props.onScroll) {
            this.props.onScroll(this._getView());
        }
    }

    public componentWillUnmount() {
        clearInterval(this._taskResize);
    }

    public render() {
        const view = this._getView();

        return (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div
                    className={this.props.className}
                    ref={this._onRef}
                    onScroll={this._onScroll}
                    style={{
                        ...this.props.style,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        overflow: this.props.preserveScrollbars ? 'scroll' : 'auto'
                    }}
                >
                    {this.props.bodyRenderer(view)}
                </div>
                {this.props.headersRenderer(view)}
            </div>
        );
    }
}

export default ScrollView;
