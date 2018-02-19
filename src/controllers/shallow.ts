// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
function is(x: any, y: any) {
    return x === y ? x !== 0 || 1 / x === 1 / y : x !== x && y !== y;
}

/**
 * Shallow cache.
 *
 * If next object contains same keys and values - returns cached value instead.
 *
 * Optional callback called when changes were detected.
 */
export function Shallow<T>(callback?: () => void) {
    let prev: T = void 0;

    return (next: T) => {
        if (is(prev, next)) {
            return prev;
        }

        if (typeof prev !== 'object' || typeof next !== 'object') {
            if (callback) {
                callback();
            }

            return prev = next;
        }

        let nextKeys = Object.keys(next);
        let prevKeys = Object.keys(prev);

        if (nextKeys.length !== prevKeys.length) {
            if (callback) {
                callback();
            }

            return prev = next;
        }

        for (const k of prevKeys) {
            if (!next.hasOwnProperty(k) || !is((prev as any)[k], (next as any)[k])) {
                if (callback) {
                    callback();
                }

                return prev = next;
            }
        }

        return prev;
    };
}

export default Shallow;
