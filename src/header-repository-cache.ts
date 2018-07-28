import { IHeader, HeaderType } from './types';

export interface IHeaderRepositoryCache {
    /** Set size to header. Note if header in $collapsed = true state. */
    getHeaderSize(header: IHeader, type: HeaderType): number;
    /** Get size assigned to header. Note if header in $collapsed = true state. */
    setHeaderSize(size: number, header: IHeader, type: HeaderType): void;
    /** Set header level size. */
    getLevelSize(level: number, type: 'top' | 'left'): number;
    /** Get header level size. */
    setLevelSize(size: number, level: number, type: 'top' | 'left'): void;
    /** Set total number of levels. */
    getLevels(type: 'top' | 'left'): number;
    /** Get total number of levels. */
    setLevels(levels: number, type: 'top' | 'left'): void;
    /** Set total size of all levels. */
    getOffset(type: 'top' | 'left'): number;
    /** Get total size of all levels. */
    setOffset(size: number, type: 'top' | 'left'): void;
    /** Get header autosize lock. If true - header will not be automatically expanded by cells content. */
    getHeaderLock(header: IHeader, type: HeaderType): boolean;
    /** Get header autosize lock. If true - header will not be automatically expanded by cells content. */
    setHeaderLock(locked: boolean, header: IHeader, type: HeaderType): void;
    /** Get level autosize lock. If true - level will not be automatically expanded by headers content. */
    getLevelLock(level: number, type: HeaderType): boolean;
    /** Set level autosize lock. If true - level will not be automatically expanded by headers content. */
    setLevelLock(locked: boolean, level: number, type: HeaderType): void;
}

export class HeaderRepositoryCache implements IHeaderRepositoryCache {
    protected _level = {
        top: {} as { [i: string]: number },
        left: {} as { [i: string]: number }
    };

    protected _levels = {
        left: 0,
        top: 0
    };

    protected _offset = {
        left: 0,
        top: 0
    };

    protected _levelLock = new Set<string>();

    public getHeaderSize(_header: IHeader, _type: HeaderType): number {
        throw new Error('HeaderRepositoryCache.getSize is not implemented.');
    }

    public setHeaderSize(_size: number, _header: IHeader, _type: HeaderType): void {
        throw new Error('HeaderRepositoryCache.setSize is not implemented.');
    }

    public getHeaderLock(_header: IHeader, _type: HeaderType): boolean {
        throw new Error('HeaderRepositoryCache.getHeaderLock is not implemented.');
    }

    public setHeaderLock(_locked: boolean, _header: IHeader, _type: HeaderType): void {
        throw new Error('HeaderRepositoryCache.setHeaderLock is not implemented.');
    }

    public getLevelSize(level: number, type: 'top' | 'left'): number {
        return this._level[type][level] || 0;
    }

    public setLevelSize(size: number, level: number, type: 'top' | 'left'): void {
        this._level[type][level] = size;
    }

    public getLevels(type: 'top' | 'left'): number {
        return this._levels[type] || 0;
    }

    public setLevels(levels: number, type: 'top' | 'left'): void {
        this._levels[type] = levels;
    }

    public getOffset(type: 'top' | 'left'): number {
        return this._offset[type] || 0;
    }

    public setOffset(size: number, type: 'top' | 'left'): void {
        this._offset[type] = size;
    }

    public getLevelLock(level: number, type: HeaderType): boolean {
        return this._levelLock.has(`${type}:${level}`);
    }

    public setLevelLock(locked: boolean, level: number, type: HeaderType): void {
        this._levelLock[locked ? 'add' : 'delete'](`${type}:${level}`);
    }

}
