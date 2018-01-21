let size: number = null;

export function getScrollbarSize() {
    if (size !== null) {
        return size;
    }

    let d = document.createElement('div');
    d.style.overflow = 'scroll';
    d.style.boxSizing = 'border-box';
    d.style.position = 'fixed';
    d.style.top = '-999px';
    d.style.width = '100px';
    d.style.height = '100px';

    document.body.appendChild(d);

    size = (100 - d.clientWidth) || (100 - d.clientHeight);

    document.body.removeChild(d);

    return size;
}

export default getScrollbarSize;
