import { HeaderType } from '../index';

export interface IHeader {
    /** List of children headers. */
    children?: IHeader[];
    /** Initial size. */
    size?: number;
    /** Filter flag. */
    collapsed?: boolean;

    /** Assigned by HeadersContainer. Do not edit. */
    id?: number;
    /** Assigned by HeadersContainer. Do not edit. */
    type?: HeaderType;
    /** Assigned by HeadersContainer. Do not edit. */
    position?: number;
    /** Assigned by HeadersContainer. Do not edit. */
    index?: number;
    /** Assigned by HeadersContainer. Do not edit. */
    level?: number;
    /** Assigned by HeadersContainer. Do not edit. */
    parent?: IHeader;

    [prop: string]: any;
}

export const HeaderParentReference = Symbol(`[[IHeader.parent]]`);

export function headerToJSON(this: IHeader) {
    let c = {
        ...this,
    };

    delete c.parent;

    if (this.parent) {
        c.parent = HeaderParentReference as any;
    }

    return c;
}
