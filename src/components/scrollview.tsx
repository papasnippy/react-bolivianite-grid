import * as React from 'react';
import { getScrollbarSize, getRelativePosition, render } from '../controllers';

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
    middleLayer?: boolean;
    height?: number | string;
    width?: number | string;
    lock?: 'x' | 'y';
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

    public get minimized() {
        return this._xmove === -1 && this._ymove === -1 && this.state.minimized;
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

    public get currentScrollbarSize() {
        const size = (
            this.minimized
                ? this.props.scrollbarWidthMinimized
                : this.props.scrollbarWidth
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

        if (this.props.onScroll) {
            this.props.onScroll(this._getUpdateEventObject());
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
        let t = this.scrollbarMinimizeDistance;
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
        if (this._xmove === -1 && this._ymove === -1) {
            return;
        }

        this._xmove = -1;
        this._ymove = -1;

        this.forceUpdate();
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

    private _joinClassNames(...cn: string[]) {
        return cn.map(v => (v || '').trim()).filter(v => !!v).join(' ');
    }

    private _joinStyles(...s: React.CSSProperties[]): React.CSSProperties {
        return Object.assign({}, ...(s.map(v => v || {})));
    }

    private _getClassNames(type: 'Right' | 'Bottom') {
        const p = this.props as any;
        return {
            classNameTrackRoot: this._joinClassNames(p.classNameTrackRoot, p[`classNameTrackRoot${type}`]),
            classNameTrack: this._joinClassNames(p.classNameTrack, p[`classNameTrack${type}`]),
            classNameThumb: this._joinClassNames(p.classNameThumb, p[`classNameThumb${type}`]),
        };
    }

    private _getStyles(type: 'Right' | 'Bottom') {
        const p = this.props as any;
        return {
            styleTrackRoot: this._joinStyles(p.styleTrackRoot, p[`styleTrackRoot${type}`]),
            styleTrack: this._joinStyles(p.styleTrack, p[`styleTrack${type}`]),
            styleThumb: this._joinStyles(p.styleThumb, p[`styleThumb${type}`]),
        };
    }

    /** Calculates scrollbar size, position and scale ratio. Then updates scrollbars directly. */
    private _updateScrollbars(cb?: () => void) {
        let t = this._r;
        let ss = this.scrollbarSize;
        let sx = this.props.lock === 'x' ? 0 : ss;
        let sy = this.props.lock === 'y' ? 0 : ss;
        let sm = this.scrollbarTrackMinimum; // scrollbar minimum length

        // size of the canvas
        let c = t.children[0] as HTMLElement;
        this._xlen = c.clientWidth + c.offsetLeft;
        this._ylen = c.clientHeight + c.offsetTop;

        let viewportWidth = t.clientWidth;
        let viewportHeight = t.clientHeight;

        this._xratio = viewportWidth === this._xlen ? 1 : Math.max(0, Math.min(1, (viewportWidth - ss) / this._xlen));
        this._yratio = viewportHeight === this._ylen ? 1 : Math.max(0, Math.min(1, (viewportHeight - ss) / this._ylen));
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

    private _renderBody() {
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
                style={{
                    ...(this.props.scrollerProps && this.props.scrollerProps.style || {}),
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: this.props.lock === 'x' ? 0 : -this._scrollBarSize,
                    bottom: this.props.lock === 'y' ? 0 : -this._scrollBarSize,
                    overflow: 'scroll',
                    boxSizing: 'content-box',
                    ...ap
                }}
            >
                {
                    this.props.middleLayer
                        ? <div>{this.props.children}</div>
                        : this.props.children
                }
            </div>
        );
    }

    private _renderXScrollbar(scrollSize: number) {
        const { classNameThumb, classNameTrack, classNameTrackRoot } = this._getClassNames('Bottom');
        const { styleThumb, styleTrack, styleTrackRoot } = this._getStyles('Bottom');

        return (
            <div
                className={classNameTrackRoot}
                style={{
                    ...styleTrackRoot,
                    position: 'absolute',
                    left: 0,
                    right: this.props.lock === 'x' ? 0 : scrollSize,
                    bottom: 0,
                    height: scrollSize,
                    display: !this.state.xEnabled || this.props.lock === 'y' ? 'none' : '',
                    zIndex: 1
                }}
            >
                <div
                    className={classNameTrack}
                    style={{
                        ...styleTrack,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden'
                    }}
                    onMouseDown={this._onScrollMouseX}
                />
                <div
                    className={classNameThumb}
                    ref={this._onRefX}
                    style={{
                        ...styleThumb,
                        position: 'absolute',
                        top: 0,
                        height: '100%'
                    }}
                />
            </div>
        );
    }

    private _renderYScrollbar(scrollSize: number) {
        const { classNameThumb, classNameTrack, classNameTrackRoot } = this._getClassNames('Right');
        const { styleThumb, styleTrack, styleTrackRoot } = this._getStyles('Right');

        return (
            <div
                className={classNameTrackRoot}
                style={{
                    ...styleTrackRoot,
                    position: 'absolute',
                    right: 0,
                    bottom: this.props.lock === 'y' ? 0 : scrollSize,
                    top: 0,
                    width: scrollSize,
                    display: !this.state.yEnabled || this.props.lock === 'x' ? 'none' : '',
                    zIndex: 1
                }}
            >
                <div
                    className={classNameTrack}
                    style={{
                        ...styleTrack,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        overflow: 'hidden'
                    }}
                    onMouseDown={this._onScrollMouseY}
                />
                <div
                    className={classNameThumb}
                    ref={this._onRefY}
                    style={{
                        ...styleThumb,
                        position: 'absolute',
                        right: 0,
                        width: '100%'
                    }}
                />
            </div>
        );
    }

    private _renderZScrollbar(scrollSize: number) {
        return (
            <div
                className={this._joinClassNames(
                    this.props.classNameTrackRoot,
                    this.props.classNameTrackCorner
                )}
                style={{
                    ...(this._joinStyles(
                        this.props.styleTrackRoot || {},
                        this.props.styleTrackCorner || {}
                    )),
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    height: scrollSize,
                    width: scrollSize,
                    display: (
                        (
                            (!this.state.xEnabled && !this.state.yEnabled) ||
                            (this.props.lock === 'x' || this.props.lock === 'y')
                        )
                            ? 'none'
                            : ''
                    ),
                    zIndex: 1
                }}
            />
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
                this._updateScrollbars();
                this._onScroll(null);
            }
        }, 20);

        this._updateScrollbars(() => {
            if (this.props.onScroll) {
                this.props.onScroll(this._getUpdateEventObject());
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
        let { currentScrollbarSize, props } = this;

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
                onMouseMove={this._onRootMouseMove}
                onMouseLeave={this._onRootMouseLeave}
            >
                {this._renderBody()}
                {render(props.renderAfter, () => this._getUpdateEventObject())}
                {this._renderXScrollbar(currentScrollbarSize)}
                {this._renderYScrollbar(currentScrollbarSize)}
                {this._renderZScrollbar(currentScrollbarSize)}
            </div>
        );
    }
}

export default ScrollView;
