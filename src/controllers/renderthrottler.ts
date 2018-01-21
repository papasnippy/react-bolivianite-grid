export class RenderThrottler {
    private _ids = 0;
    private _tasks: {
        [id: string]: Function
    } = {};
    private _active = true;

    constructor() {
        this._step = this._step.bind(this);
        window.requestAnimationFrame(this._step);
    }

    private _step() {
        let c = 0;
        for (let id of Object.keys(this._tasks)) {
            let f = this._tasks[id];

            if (f) {
                f();
            }

            delete this._tasks[id];
            c++;
        }

        if (!c) {
            this._active = false;
        } else {
            window.requestAnimationFrame(this._step);
        }
    }

    public create() {
        const id = this._ids++;
        return (fn: Function) => {
            this._tasks[id] = fn;

            if (!this._active) {
                this._active = true;
                window.requestAnimationFrame(this._step);
            }
        };
    }
}

export default RenderThrottler;
