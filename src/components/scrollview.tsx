import * as React from 'react';
import { getScrollbarSize, getRelativePosition, Shallow } from '../controllers';

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
    trackRoot?: string;
    track?: string;
    thumb?: string;
    bottomTrack?: string;
    bottomThumb?: string;
    rightTrack?: string;
    rightThumb?: string;
    scrollCorner?: string;
}

export interface IScrollViewThemeStyles {
    trackRoot?: React.CSSProperties;
    track?: React.CSSProperties;
    thumb?: React.CSSProperties;
    bottomTrack?: React.CSSProperties;
    bottomThumb?: React.CSSProperties;
    rightTrack?: React.CSSProperties;
    rightThumb?: React.CSSProperties;
    scrollCorner?: React.CSSProperties;
}

export interface IScrollViewTheme {
    scrollSize?: number;
    scrollSizeMinimized?: number;
    scrollMinimum?: number;
    trackBackground?: string;
    thumbBackground?: string;
    classNames?: IScrollViewThemeClassNames;
    styles?: IScrollViewThemeStyles;
}

export interface IScrollViewProps {
    middleLayer?: boolean;

    height?: number | string;
    width?: number | string;
    /** If defined scrollbars will be rendered over content. No padding for scrollbars. Value defines hover detect size. */
    hover?: number;
    /** If defined - scrollbar will br enabled only for x or y axis */
    lock?: 'x' | 'y';
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
        yEnabled: false,
        minimized: true
    };

    private _sh = {
        root: Shallow<React.CSSProperties>(),
        body: Shallow<React.CSSProperties>(),
        bodyPadding: Shallow<React.CSSProperties>(),
        xRoot: Shallow<React.CSSProperties>(),
        xTrack: Shallow<React.CSSProperties>(),
        xThumb: Shallow<React.CSSProperties>(),
        yRoot: Shallow<React.CSSProperties>(),
        yTrack: Shallow<React.CSSProperties>(),
        yThumb: Shallow<React.CSSProperties>(),
        zRoot: Shallow<React.CSSProperties>(),
        zTrack: Shallow<React.CSSProperties>(),
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
        theme.scrollSizeMinimized = theme.scrollSizeMinimized || 5;
        theme.scrollMinimum = theme.scrollMinimum || 20;
        theme.styles.trackRoot = theme.styles.trackRoot || {};
        theme.styles.track = theme.styles.track || {};
        theme.styles.thumb = theme.styles.thumb || {};
        theme.styles.bottomThumb = theme.styles.bottomThumb || {};
        theme.styles.bottomTrack = theme.styles.bottomTrack || {};
        theme.styles.rightTrack = theme.styles.rightTrack || {};
        theme.styles.rightThumb = theme.styles.rightThumb || {};
        theme.styles.scrollCorner = theme.styles.scrollCorner || {};
        return theme;
    }

    public get size() {
        return this.props.hover ? 0 : Math.max(0, this._theme.scrollSize || 0);
    }

    public get scrollbarSize() {
        const size = (
            this.props.hover && this.state.minimized
                ? this._theme.scrollSizeMinimized
                : this._theme.scrollSize
        );

        return Math.max(0, size || 0);
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
        let size = this.props.lock === 'x' ? 0 : this.size;
        return this._r.scrollWidth - (this.props.hover ? 0 : size);
    }

    public get scrollHeight() {
        let size = this.props.lock === 'y' ? 0 : this.size;
        return this._r.scrollHeight - (this.props.hover ? 0 : size);
    }

    public get clientWidth() {
        let size = this.props.lock === 'x' ? 0 : this.size;
        return this._a.clientWidth - (this.props.hover ? 0 : size);
    }

    public get clientHeight() {
        let size = this.props.lock === 'y' ? 0 : this.size;
        return this._a.clientHeight - (this.props.hover ? 0 : size);
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

    private _onRootMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        let { x, y } = getRelativePosition(e.pageX, e.pageY, this._a);
        let h = this._a.clientHeight;
        let w = this._a.clientWidth;
        let t = this.props.hover;
        let minimized = (
            (this.props.lock && this.props.lock !== 'y' || w - x > t) &&
            (this.props.lock && this.props.lock !== 'x' || h - y > t)
        );

        if (minimized !== this.state.minimized) {
            this.setState({ minimized });
        }
    }

    private _onRootMouseLeave = () => {
        this.setState({ minimized: true });
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
        let sx = this.props.lock === 'x' ? 0 : ss;
        let sy = this.props.lock === 'y' ? 0 : ss;
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
        return typeof jsx === 'function' ? jsx(props) : React.cloneElement(React.Children.only(jsx), props);
    }

    private _renderBody(paddingSize: number) {
        let ap: any = {};

        if (this.props.lock === 'x') {
            ap['overflowY'] = 'hidden';
        } else if (this.props.lock === 'y') {
            ap['overflowX'] = 'hidden';
        }

        return (
            <div
                {...this.props.scrollerProps}
                ref={this._onRef}
                style={this._sh.body({
                    ...(this.props.scrollerProps && this.props.scrollerProps.style || {}),
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: this.props.lock === 'x' ? 0 : -this._scrollBarSize,
                    bottom: this.props.lock === 'y' ? 0 : -this._scrollBarSize,
                    overflow: 'scroll',
                    boxSizing: 'content-box',
                    ...ap
                })}
            >
                {this.props.middleLayer
                    ? (
                        <div
                            style={this._sh.bodyPadding({
                                display: 'inline-flex',
                                paddingRight: this.props.lock === 'x' ? 0 : paddingSize,
                                paddingBottom: this.props.lock === 'y' ? 0 : paddingSize
                            })}
                        >
                            {this.props.children}
                        </div>
                    )
                    : (
                        this.props.children
                    )
                }
            </div>
        );
    }

    private _renderXScrollbar(scrollSize: number) {
        return (
            <div
                className={this._theme.classNames.trackRoot}
                style={this._sh.xRoot({
                    ...this._theme.styles.trackRoot,
                    background: this._theme.trackBackground,
                    position: 'absolute',
                    left: 0,
                    right: this.props.lock === 'x' ? 0 : scrollSize,
                    bottom: 0,
                    height: scrollSize,
                    display: this.props.lock === 'y' ? 'none' : '',
                    zIndex: 1
                })}
            >
                <div
                    className={[this._theme.classNames.track, this._theme.classNames.bottomTrack].filter(v => !!v).join(' ')}
                    style={this._sh.xTrack({
                        ...this._theme.styles.track,
                        ...this._theme.styles.bottomTrack,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden'
                    })}
                    onMouseDown={this._onScrollMouseX}
                >
                    {this._renderPartial(this.props.xBackgroundContent)}
                </div>
                <div
                    className={this._theme.classNames.bottomThumb}
                    ref={this._onRefX}
                    style={this._sh.xThumb({
                        background: this._theme.thumbBackground,
                        ...this._theme.styles.thumb,
                        ...this._theme.styles.bottomThumb,
                        position: 'absolute',
                        top: 0,
                        height: '100%',
                        display: this.state.xEnabled ? '' : 'none'
                    })}
                >
                    {this._renderPartial(this.props.xScrollContent)}
                </div>
            </div>
        );
    }

    private _renderYScrollbar(scrollSize: number) {
        return (
            <div
                className={this._theme.classNames.trackRoot}
                style={this._sh.yRoot({
                    ...this._theme.styles.trackRoot,
                    background: this._theme.trackBackground,
                    position: 'absolute',
                    right: 0,
                    bottom: this.props.lock === 'y' ? 0 : scrollSize,
                    top: 0,
                    width: scrollSize,
                    display: this.props.lock === 'x' ? 'none' : '',
                    zIndex: 1
                })}
            >
                <div
                    className={[this._theme.classNames.track, this._theme.classNames.rightTrack].filter(v => !!v).join(' ')}
                    style={this._sh.yTrack({
                        ...this._theme.styles.track,
                        ...this._theme.styles.rightTrack,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden'
                    })}
                    onMouseDown={this._onScrollMouseY}
                >
                    {this._renderPartial(this.props.yBackgroundContent)}
                </div>
                <div
                    className={this._theme.classNames.rightTrack}
                    ref={this._onRefY}
                    style={this._sh.yThumb({
                        background: this._theme.thumbBackground,
                        ...this._theme.styles.thumb,
                        ...this._theme.styles.rightThumb,
                        position: 'absolute',
                        right: 0,
                        width: '100%',
                        display: this.state.yEnabled ? '' : 'none'
                    })}
                >
                    {this._renderPartial(this.props.yScrollContent)}
                </div>

            </div>
        );
    }

    private _renderZScrollbar(scrollSize: number) {
        return (
            <div
                className={this._theme.classNames.trackRoot}
                style={this._sh.zRoot({
                    ...this._theme.styles.trackRoot,
                    background: this._theme.trackBackground,
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    height: scrollSize,
                    width: scrollSize,
                    display: (this.props.lock === 'x' || this.props.lock === 'y') ? 'none' : '',
                    zIndex: 1
                })}
            >
                <div
                    className={this._theme.classNames.scrollCorner}
                    style={this._sh.zTrack({
                        ...this._theme.styles.scrollCorner,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden',
                        pointerEvents: 'none'
                    })}
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
        let ss = this.scrollbarSize;
        return (
            <div
                ref={this._onRefA}
                style={this._sh.root({
                    height: this.props.height == void 0 ? '100%' : this.props.height,
                    width: this.props.width == void 0 ? '100%' : this.props.width,
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden'
                })}
                onMouseMove={this._onRootMouseMove}
                onMouseLeave={this._onRootMouseLeave}
            >
                {this._renderBody(this.size)}
                {this._renderPartial(this.props.after, () => this._getUpdateEventObject())}
                {this._renderXScrollbar(ss)}
                {this._renderYScrollbar(ss)}
                {this._renderZScrollbar(ss)}
            </div>
        );
    }
}

export default ScrollView;
