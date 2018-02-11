// import { HeaderType } from '../index';

export interface IHeader {
    /** Unique header identifier. Do not edit. Assigned by header container if not provided. */
    $id?: number | string;
    /** List of children headers. */
    $children?: IHeader[];
    /** Header size. */
    $size?: number;
    /** Filter flag. */
    $collapsed?: boolean;

    [prop: string]: any;
}
