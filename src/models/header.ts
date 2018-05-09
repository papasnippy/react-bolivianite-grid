export enum HeaderType {
    Row = 1,
    Column
}

export interface IHeader {
    /** Unique header identifier for **all** headers in container.
     * Do not edit. Assigned by header container if not provided.
     * Can be assigned once before used. */
    $id?: number | string;
    /** List of children headers. */
    $children?: IHeader[];
    /** Size of current header. */
    $size?: number;
    /** Size of current header when collapsed. */
    $sizeCollapsed?: number;
    /** Filter flag. */
    $collapsed?: boolean;

    /** Any other custom properties. */
    [prop: string]: any;
}
