import { IHeader, HeaderType } from './types';

export interface IHeaderRepositoryCache {
    getHeaderSize(header: IHeader, type: HeaderType): number;
    setHeaderSize(size: number, header: IHeader, type: HeaderType): void;
    getLevelSize(level: number, type: 'top' | 'left'): number;
    setLevelSize(size: number, level: number, type: 'top' | 'left'): void;
    getLevels(type: 'top' | 'left'): number;
    setLevels(levels: number, type: 'top' | 'left'): void;
    getOffset(type: 'top' | 'left'): number;
    setOffset(size: number, type: 'top' | 'left'): void;
    getHeaderLock(header: IHeader, type: HeaderType): boolean;
    setHeaderLock(locked: boolean, header: IHeader, type: HeaderType): void;
    getLevelLock(level: number, type: HeaderType): boolean;
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
