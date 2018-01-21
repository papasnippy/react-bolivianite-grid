export function debounce(time: number, fn: Function) {
    let task: any = null;

    return (...args: any[]) => {
        if (task) {
            clearTimeout(task);
        }

        task = setTimeout(() => {
            task = null;
            fn(...args);
        }, time);
    };
}

export default debounce;
