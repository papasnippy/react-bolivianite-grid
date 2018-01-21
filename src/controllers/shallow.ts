export function Shallow<T>() {
    let prev: T = void 0;

    return (next: T) => {
        if (prev === next) {
            return prev;
        }

        if (!prev || !next) {
            return prev = next;
        }

        let nextKeys = Object.keys(next);
        let prevKeys = Object.keys(prev);

        if (nextKeys.length !== prevKeys.length) {
            return prev = next;
        }

        if (nextKeys.every(k => (prev as any)[k] === (next as any)[k])) {
            return prev;
        }

        return prev = next;
    };
}

export default Shallow;
