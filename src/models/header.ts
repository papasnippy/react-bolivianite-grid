export enum HeaderType {
    Row = 1,
    Column
}

export interface IHeader {
    /** Unique header identifier for **all** headers in container. Do not edit. Assigned by header container if not provided. */
    $id?: number | string;
    /** List of children headers. */
    $children?: IHeader[];
    /** Size of current header. */
    $size?: number;
    /** Filter flag. */
    $collapsed?: boolean;

    [prop: string]: any;
}
