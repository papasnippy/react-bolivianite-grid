/**  Get element relative coordinates. */
export function getRelativePosition(pageX: number, pageY: number, element: HTMLElement) {
    if (!element || !element.parentElement) {
        return { x: pageX, y: pageY };
    }

    let p = element;

    do {
        pageX -= p.offsetLeft;
        pageY -= p.offsetTop;
    } while (p = p.offsetParent as HTMLElement);

    return { x: pageX, y: pageY };
}
