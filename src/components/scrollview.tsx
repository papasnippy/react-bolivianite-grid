import * as React from 'react';
import { render } from '../controllers';

export interface IScrollViewUpdateEvent {
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
    scrollbarSize: number;
}

export type TScrollViewPartial<T = any> = JSX.Element | ((props: T) => JSX.Element);

export interface IScrollViewThemingProps {
    scrollbarWidth?: number;
    scrollbarWidthMinimized?: number;
    scrollbarTrackMinimum?: number;
    scrollbarMinimizeDistance?: number;

    className?: string;
    classNameTrackCorner?: string;
    classNameTrackRoot?: string;
    classNameTrack?: string;
    classNameThumb?: string;
    classNameTrackRootRight?: string;
    classNameTrackRight?: string;
    classNameThumbRight?: string;
    classNameTrackRootBottom?: string;
    classNameTrackBottom?: string;
    classNameThumbBottom?: string;

    style?: React.CSSProperties;
    styleTrackCorner?: React.CSSProperties;
    styleTrackRoot?: React.CSSProperties;
    styleTrack?: React.CSSProperties;
    styleThumb?: React.CSSProperties;
    styleTrackRootRight?: React.CSSProperties;
    styleTrackRight?: React.CSSProperties;
    styleThumbRight?: React.CSSProperties;
    styleTrackRootBottom?: React.CSSProperties;
    styleTrackBottom?: React.CSSProperties;
    styleThumbBottom?: React.CSSProperties;
}

export interface IScrollViewProps extends IScrollViewThemingProps {
    height?: number | string;
    width?: number | string;
    scrollerProps?: React.HTMLProps<HTMLDivElement>;
    renderAfter?: TScrollViewPartial<IScrollViewUpdateEvent>;
    onScroll?: (event: IScrollViewUpdateEvent) => void;
}

export class ScrollView extends React.Component<IScrollViewProps, any> {
    state = {
        xEnabled: false,
        yEnabled: false,
        minimized: true
    };

    private _a: HTMLDivElement;
    private _r: HTMLDivElement;
    private _taskResize: any = null;

    constructor(p: IScrollViewProps, c: any) {
        super(p, c);
    }

    public get scrollbarMinimizeDistance() {
        return Math.max(0, this.props.scrollbarMinimizeDistance || 100);
    }

    public get scrollbarTrackMinimum() {
        return Math.max(0, this.props.scrollbarTrackMinimum || 20);
    }

    public get scrollbarSize() {
        return Math.max(0, this.props.scrollbarWidth || 0);
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

    public get scrollWidth() {
        return this._r.scrollWidth;
    }

    public get scrollHeight() {
        return this._r.scrollHeight;
    }

    public get clientWidth() {
        return this._a.clientWidth;
    }

    public get clientHeight() {
        return this._a.clientHeight;
    }

    private _onRef = (r: HTMLDivElement) => {
        this._r = r;
    }

    private _onRefA = (a: HTMLDivElement) => {
        this._a = a;
    }

    private _onScroll = (e: UIEvent) => {
        if (!e || e && this._r !== e.target) {
            return;
        }

        // we are using native scroll event, so we need to call onScroll
        // ONLY after forcing self component to update
        // otherwise it will freeze browser
        // TODO: consider about rollback to React.ScrollEvent.
        // native scroll was need for custom scrollbars, but it was decided
        // to rollback to native scrollbars
        this.forceUpdate(() => {
            if (this.props.onScroll) {
                this.props.onScroll(this._getUpdateEventObject());
            }
        });
    }

    private _getUpdateEventObject(): IScrollViewUpdateEvent {
        if (!this._r) {
            return {
                scrollLeft: 0,
                scrollTop: 0,
                scrollWidth: 0,
                scrollHeight: 0,
                clientWidth: 0,
                clientHeight: 0,
                scrollbarSize: this.scrollbarSize
            };
        }

        return {
            scrollLeft: this.scrollLeft,
            scrollTop: this.scrollTop,
            scrollWidth: this.scrollWidth,
            scrollHeight: this.scrollHeight,
            clientWidth: this.clientWidth,
            clientHeight: this.clientHeight,
            scrollbarSize: this.scrollbarSize
        };
    }

    private _renderBody() {
        let ap: any = {};

        return (
            <div
                {...this.props.scrollerProps}
                ref={this._onRef}
                style={{
                    ...(this.props.scrollerProps && this.props.scrollerProps.style || {}),
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    overflow: 'scroll',
                    boxSizing: 'content-box',
                    ...ap
                }}
            >
                {this.props.children}
            </div>
        );
    }


    public componentDidMount() {
        this.setState({
            scrollHeight: this._r.offsetHeight - this._r.clientHeight,
            scrollWidth: this._r.offsetWidth - this._r.clientWidth
        });

        this._r.addEventListener('scroll', this._onScroll);

        let t = this._r;
        let c = t.children[0] as HTMLElement;

        let rootWidth = t.clientWidth;
        let rootHeight = t.clientHeight;
        let canvasWidth = c ? c.clientWidth + c.offsetLeft : 0;
        let canvasHeight = c ? c.clientHeight + c.offsetTop : 0;

        this._taskResize = setInterval(() => {
            let newRootWidth = t.clientWidth;
            let newRootHeight = t.clientHeight;
            let newCanvasWidth = c ? c.clientWidth + c.offsetLeft : 0;
            let newCanvasHeight = c ? c.clientHeight + c.offsetTop : 0;

            if (
                newRootWidth !== rootWidth || newRootHeight !== rootHeight ||
                newCanvasWidth !== canvasWidth || newCanvasHeight !== canvasHeight
            ) {
                rootWidth = newRootWidth;
                rootHeight = newRootHeight;
                canvasWidth = newCanvasWidth;
                canvasHeight = newCanvasHeight;
                this._onScroll(null);
            }
        }, 20);

        if (this.props.onScroll) {
            this.props.onScroll(this._getUpdateEventObject());
        }
    }

    public componentWillUnmount() {
        this._r.removeEventListener('scroll', this._onScroll);
        clearInterval(this._taskResize);
    }

    public render() {
        let { props } = this;

        return (
            <div
                className={this.props.className}
                ref={this._onRefA}
                style={{
                    height: props.height == void 0 ? '100%' : props.height,
                    width: props.width == void 0 ? '100%' : props.width,
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                    ...this.props.style
                }}
            >
                {this._renderBody()}
                {render(props.renderAfter, () => this._getUpdateEventObject())}
            </div>
        );
    }
}

export default ScrollView;
