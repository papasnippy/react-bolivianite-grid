import * as React from 'react';
import { getScrollbarSize } from '../controllers';

export interface IScrollViewUpdateEvent {
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
}

export type TScrollViewPartial<T = any> = JSX.Element | ((props: T) => JSX.Element);

export interface IScrollViewThemeClassNames {
    bottomTrack?: string;
    bottomThumb?: string;
    rightTrack?: string;
    rightThumb?: string;
    scrollCorner?: string;
}

export interface IScrollViewThemeStyles {
    bottomTrack?: React.CSSProperties;
    bottomThumb?: React.CSSProperties;
    rightTrack?: React.CSSProperties;
    rightThumb?: React.CSSProperties;
    scrollCorner?: React.CSSProperties;
}

export interface IScrollViewTheme {
    scrollSize?: number;
    scrollMinimum?: number;
    trackBackground?: string;
    thumbBackground?: string;
    classNames?: IScrollViewThemeClassNames;
    styles?: IScrollViewThemeStyles;
}

export interface IScrollViewProps {
    height?: number | string;
    width?: number | string;
    /** If true - scrollbars will be rendered over content. No padding for scrollbars */
    over?: boolean;
    /** If defined - scrollbar will br enabled only for x or y axis */
    mode?: 'x' | 'y';
    /** Css props passed to scroller element */
    scrollerProps?: React.HTMLProps<HTMLDivElement>;

    after?: TScrollViewPartial<IScrollViewUpdateEvent>;

    theme?: IScrollViewTheme;

    xScrollContent?: TScrollViewPartial;
    xBackgroundContent?: TScrollViewPartial;

    yScrollContent?: TScrollViewPartial;
    yBackgroundContent?: TScrollViewPartial;

    zBackgroundContent?: TScrollViewPartial;

    onUpdate?: (event: IScrollViewUpdateEvent) => void;
}

export class ScrollView extends React.Component<IScrollViewProps, any> {
    state = {
        xEnabled: false,
        yEnabled: false
    };

    private _scrollBarSize = getScrollbarSize();
    private _a: HTMLDivElement;
    private _r: HTMLDivElement;
    private _x: HTMLDivElement;
    private _y: HTMLDivElement;
    private _taskResize: any = null;
    private _xpos = 0;
    private _ypos = 0;
    private _xratio = 1;
    private _yratio = 1;
    private _xsize = 0; // internal
    private _ysize = 0;
    private _xlen = 0; // external
    private _ylen = 0;
    private _xmove = -1; // scroll moving start positions
    private _xmoveScrollPos = 0;
    private _ymove = -1;
    private _ymoveScrollPos = 0;

    constructor(p: IScrollViewProps, c: any) {
        super(p, c);
    }

    private get _theme() {
        let theme = this.props.theme || {};
        theme.classNames = theme.classNames || {};
        theme.styles = theme.styles || {};
        theme.scrollSize = theme.scrollSize || 17;
        theme.scrollMinimum = theme.scrollMinimum || 20;
        theme.styles.bottomThumb = theme.styles.bottomThumb || {};
        theme.styles.bottomTrack = theme.styles.bottomTrack || {};
        theme.styles.rightTrack = theme.styles.rightTrack || {};
        theme.styles.rightThumb = theme.styles.rightThumb || {};
        theme.styles.scrollCorner = theme.styles.scrollCorner || {};
        return theme;
    }

    public get size() {
        return Math.max(0, this._theme.scrollSize || 0);
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
        let size = this.props.mode === 'x' ? 0 : this.size;
        return this._r.scrollWidth - (this.props.over ? 0 : size);
    }

    public get scrollHeight() {
        let size = this.props.mode === 'y' ? 0 : this.size;
        return this._r.scrollHeight - (this.props.over ? 0 : size);
    }

    public get clientWidth() {
        let size = this.props.mode === 'x' ? 0 : this.size;
        return this._a.clientWidth - (this.props.over ? 0 : size);
    }

    public get clientHeight() {
        let size = this.props.mode === 'y' ? 0 : this.size;
        return this._a.clientHeight - (this.props.over ? 0 : size);
    }

    private _onRef = (r: HTMLDivElement) => {
        this._r = r;
    }

    private _onRefA = (a: HTMLDivElement) => {
        this._a = a;
    }

    private _onRefX = (x: HTMLDivElement) => {
        this._x = x;
    }

    private _onRefY = (y: HTMLDivElement) => {
        this._y = y;
    }

    private _onScroll = (e: UIEvent) => {
        if (e && this._r !== e.target) {
            return;
        }

        if (e) {
            this._updateScrollbars();
        }

        if (this.props.onUpdate) {
            this.props.onUpdate(this._getUpdateEventObject());
        }
    }

    private _onMouseDownX = (e: MouseEvent) => {
        this._xmove = e.clientX;
        this._xmoveScrollPos = this._r.scrollLeft;
        e.preventDefault();
    }

    private _onMouseDownY = (e: MouseEvent) => {
        this._ymove = e.clientY;
        this._ymoveScrollPos = this._r.scrollTop;
        e.preventDefault();
    }

    private _onMouseMove = (e: MouseEvent) => {
        if (this._xmove > -1) {
            this._r.scrollLeft = this._xmoveScrollPos + (e.clientX - this._xmove) / this._xratio;
        }

        if (this._ymove > -1) {
            this._r.scrollTop = this._ymoveScrollPos + (e.clientY - this._ymove) / this._yratio;
        }
    }

    private _onMouseUp = () => {
        this._xmove = -1;
        this._ymove = -1;
    }

    private _onScrollMouseY = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!this.state.yEnabled || !this._r || e.button !== 0) {
            return;
        }

        let cp = e.nativeEvent.offsetY;
        let sp = this._ypos;
        let ss = this._ysize;

        if (cp < sp) {
            this.scrollTop = Math.max(0, this.scrollTop - this.clientHeight);
        } else if (cp > sp + ss) {
            this.scrollTop = Math.min(this.scrollHeight, this.scrollTop + this.clientHeight);
        }
    }

    private _onScrollMouseX = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!this.state.xEnabled || !this._r || e.button !== 0) {
            return;
        }

        let cp = e.nativeEvent.offsetX;
        let sp = this._xpos;
        let ss = this._xsize;

        if (cp < sp) {
            this.scrollLeft = Math.max(0, this.scrollLeft - this.clientWidth);
        } else if (cp > sp + ss) {
            this.scrollLeft = Math.min(this.scrollWidth, this.scrollLeft + this.clientWidth);
        }
    }

    private _getUpdateEventObject(): IScrollViewUpdateEvent {
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
            scrollLeft: this.scrollLeft,
            scrollTop: this.scrollTop,
            scrollWidth: this.scrollWidth,
            scrollHeight: this.scrollHeight,
            clientWidth: this.clientWidth,
            clientHeight: this.clientHeight
        };
    }

    /** Calculates scrollbar size, position and scale ratio. Then updates scrollbars directly. */
    private _updateScrollbars(cb?: () => void) {
        let t = this._r;
        let ss = this.size;
        let sx = this.props.mode === 'x' ? 0 : ss;
        let sy = this.props.mode === 'y' ? 0 : ss;
        let sm = this._theme.scrollMinimum; // scrollbar minimum length

        // size of the canvas
        this._xlen = t.children[0].clientWidth;
        this._ylen = t.children[0].clientHeight;

        let viewportWidth = t.clientWidth;
        let viewportHeight = t.clientHeight;

        this._xratio = Math.max(0, Math.min(1, (viewportWidth - ss) / this._xlen));
        this._yratio = Math.max(0, Math.min(1, (viewportHeight - ss) / this._ylen));
        this._xsize = Math.round(this._xratio * viewportWidth);
        this._ysize = Math.round(this._yratio * viewportHeight);

        if (this._xsize < sm) {
            this._xratio = Math.max(0, Math.min(1, (viewportWidth - ss - (sm - this._xsize)) / this._xlen));
            this._xsize = sm;
        }

        if (this._ysize < sm) {
            this._yratio = Math.max(0, Math.min(1, (viewportHeight - ss - (sm - this._ysize)) / this._ylen));
            this._ysize = sm;
        }

        this._xpos = Math.round(t.scrollLeft / (t.scrollWidth - viewportWidth) * (viewportWidth - this._xsize - sx));
        this._ypos = Math.round(t.scrollTop / (t.scrollHeight - viewportHeight) * (viewportHeight - this._ysize - sy));

        this._x.style.left = `${this._xpos}px`;
        this._y.style.top = `${this._ypos}px`;
        this._x.style.width = `${this._xsize}px`;
        this._y.style.height = `${this._ysize}px`;

        let xEnabled = this.state.xEnabled;
        let yEnabled = this.state.yEnabled;

        if (this._xratio === 1 && this.state.xEnabled) {
            xEnabled = false;
        } else if (this._xratio < 1 && !this.state.xEnabled) {
            xEnabled = true;
        }

        if (this._yratio === 1 && this.state.yEnabled) {
            yEnabled = false;
        } else if (this._yratio < 1 && !this.state.yEnabled) {
            yEnabled = true;
        }

        this.setState({ xEnabled, yEnabled }, cb);
    }

    private _renderPartial(jsx: JSX.Element | ((props?: any) => JSX.Element), getProps?: () => any) {
        if (!jsx) {
            return jsx;
        }

        const props = getProps ? getProps() : {};

        if (typeof jsx === 'function') {
            jsx = jsx(props);
        } else {
            jsx = React.cloneElement(React.Children.only(jsx), props);
        }

        return jsx;
    }

    private _renderBody(paddingSize: number) {
        let ap: any = {};

        if (this.props.mode === 'x') {
            ap['overflowY'] = 'hidden';
        } else if (this.props.mode === 'y') {
            ap['overflowX'] = 'hidden';
        }

        return (
            <div
                {...this.props.scrollerProps}
                ref={this._onRef}
                style={{
                    ...(this.props.scrollerProps && this.props.scrollerProps.style || {}),
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: this.props.mode === 'x' ? 0 : -this._scrollBarSize,
                    bottom: this.props.mode === 'y' ? 0 : -this._scrollBarSize,
                    overflow: 'scroll',
                    boxSizing: 'content-box',
                    ...ap
                }}
            >
                <div
                    style={{
                        display: 'inline-flex',
                        paddingRight: this.props.mode === 'x' ? 0 : paddingSize,
                        paddingBottom: this.props.mode === 'y' ? 0 : paddingSize
                    }}
                >
                    {this.props.children}
                </div>
            </div>
        );
    }

    private _renderXScrollbar(scrollSize: number) {
        return (
            <div
                style={{
                    background: this._theme.trackBackground,
                    position: 'absolute',
                    left: 0,
                    right: this.props.mode === 'x' ? 0 : scrollSize,
                    bottom: 0,
                    height: scrollSize,
                    display: this.props.mode === 'y' ? 'none' : '',
                    zIndex: 1
                }}
            >
                <div
                    className={this._theme.classNames.bottomTrack}
                    style={{
                        ...this._theme.styles.bottomTrack,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden'
                    }}
                    onMouseDown={this._onScrollMouseX}
                >
                    {this._renderPartial(this.props.xBackgroundContent)}
                </div>
                <div
                    className={this._theme.classNames.bottomThumb}
                    ref={this._onRefX}
                    style={{
                        background: this._theme.thumbBackground,
                        ...this._theme.styles.bottomThumb,
                        position: 'absolute',
                        top: 0,
                        height: '100%',
                        display: this.state.xEnabled ? '' : 'none'
                    }}
                >
                    {this._renderPartial(this.props.xScrollContent)}
                </div>
            </div>
        );
    }

    private _renderYScrollbar(scrollSize: number) {
        return (
            <div
                style={{
                    background: this._theme.trackBackground,
                    position: 'absolute',
                    right: 0,
                    bottom: this.props.mode === 'y' ? 0 : scrollSize,
                    top: 0,
                    width: scrollSize,
                    display: this.props.mode === 'x' ? 'none' : '',
                    zIndex: 1
                }}
            >
                <div
                    className={this._theme.classNames.rightTrack}
                    style={{
                        ...this._theme.styles.rightTrack,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden'
                    }}
                    onMouseDown={this._onScrollMouseY}
                >
                    {this._renderPartial(this.props.yBackgroundContent)}
                </div>
                <div
                    className={this._theme.classNames.rightTrack}
                    ref={this._onRefY}
                    style={{
                        background: this._theme.thumbBackground,
                        ...this._theme.styles.rightThumb,
                        position: 'absolute',
                        right: 0,
                        width: '100%',
                        display: this.state.yEnabled ? '' : 'none'
                    }}
                >
                    {this._renderPartial(this.props.yScrollContent)}
                </div>

            </div>
        );
    }

    private _renderZScrollbar(scrollSize: number) {
        return (
            <div
                style={{
                    background: this._theme.trackBackground,
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    height: scrollSize,
                    width: scrollSize,
                    display: (this.props.mode === 'x' || this.props.mode === 'y') ? 'none' : '',
                    zIndex: 1
                }}
            >
                <div
                    className={this._theme.classNames.scrollCorner}
                    style={{
                        ...this._theme.styles.scrollCorner,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden',
                        pointerEvents: 'none'
                    }}
                >
                    {this._renderPartial(this.props.zBackgroundContent)}
                </div>
            </div>
        );
    }

    public componentDidMount() {
        this.setState({
            scrollHeight: this._r.offsetHeight - this._r.clientHeight,
            scrollWidth: this._r.offsetWidth - this._r.clientWidth
        });

        this._r.addEventListener('scroll', this._onScroll);
        this._x.addEventListener('mousedown', this._onMouseDownX);
        this._y.addEventListener('mousedown', this._onMouseDownY);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);

        let w = this._r.clientWidth;
        let h = this._r.clientHeight;

        this._taskResize = setInterval(() => {
            let nw = this._r.clientWidth;
            let nh = this._r.clientHeight;

            if (nw !== w || nh !== h) {
                h = nh;
                w = nw;
                this._updateScrollbars();
                this._onScroll(null);
            }
        }, 20);

        this._updateScrollbars(() => {
            if (this.props.onUpdate) {
                this.props.onUpdate(this._getUpdateEventObject());
            }
        });
    }

    public componentWillUnmount() {
        this._r.removeEventListener('scroll', this._onScroll);
        this._x.removeEventListener('mousedown', this._onMouseDownX);
        this._y.removeEventListener('mousedown', this._onMouseDownY);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
        clearInterval(this._taskResize);
    }

    public render() {
        let ss = this.size;
        let ps = this.props.over ? 0 : ss;

        return (
            <div
                ref={this._onRefA}
                style={{
                    height: this.props.height == void 0 ? '100%' : this.props.height,
                    width: this.props.width == void 0 ? '100%' : this.props.width,
                    boxSizing: 'border-box',
                    position: 'relative'
                }}
            >
                {this._renderBody(ps)}
                {this._renderPartial(this.props.after, () => this._getUpdateEventObject())}
                {this._renderXScrollbar(ss)}
                {this._renderYScrollbar(ss)}
                {this._renderZScrollbar(ss)}
            </div>
        );
    }
}

export default ScrollView;

