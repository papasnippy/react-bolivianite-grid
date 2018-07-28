import { HeaderRepository, HeaderType, IHeader, HeaderRepositoryCache, IHeaderRepositoryCache } from 'react-bolivianite-grid';
import AutosizingGrid from './autosizing-grid';
import { HistoryState } from './editable-grid';

/**
 * HeaderRepositoryCache is a built-in helper class. It implements some level-related
 * methods, but all header-related are virtual and must be implemented, because
 * it is up to you how to identify each header.
 */
class Cache extends HeaderRepositoryCache implements IHeaderRepositoryCache {
    sizes = new Map<string, number>();
    locked = new Map<string, boolean>();

    public getHeaderSize(header: IHeader, _type: HeaderType): number {
        return this.sizes.get(header.id) || 0;
    }

    public setHeaderSize(size: number, header: IHeader, _type: HeaderType): void {
        this.sizes.set(header.id, size);
    }

    public getHeaderLock(header: IHeader, _type: HeaderType): boolean {
        return this.locked.get(header.id) || false;
    }

    public setHeaderLock(locked: boolean, header: IHeader, _type: HeaderType): void {
        this.locked.set(header.id, locked);
    }
}

const globalCache = new Cache();

export default class extends AutosizingGrid {
    state = {
        history: [{
            data: new Map(),
            repository: null as any
        }],
        repository: this.generateRepository(200, 200), // repository outside change history
        index: 0
    };

    get currentState() {
        return {
            data: this.state.history[this.state.index].data,
            repository: this.state.repository
        };
    }

    generateRepository(rows: number, columns: number) {
        const colHeaders = (
            new Array(columns)
                .fill(null)
                .map((_, i) => {
                    return {
                        colIndex: i,
                        id: `c${i}`
                    } as IHeader;
                })
        );

        const rowlHeaders = (
            new Array(rows)
                .fill(null)
                .map((_, i) => {
                    return {
                        rowIndex: i,
                        id: `r${i}`
                    } as IHeader;
                })
        );

        return new HeaderRepository({
            cache: globalCache,
            columns: colHeaders,
            rows: rowlHeaders,
            columnWidth: 100,
            rowHeight: 24,
            headersHeight: 24,
            headersWidth: 50
        });
    }

    pushHistory(state: HistoryState, autosize = false) {
        if (!this._isMounted) {
            return;
        }

        const { data } = this.currentState;

        if (autosize || !state.data || data === state.data) {
            this.setState({
                repository: state.repository
            });
            return;
        }

        let ix = this.state.index + 1;

        this.setState({
            index: ix,
            history: [
                ...this.state.history.slice(0, ix),
                {
                    data: state.data
                }
            ]
        });
    }
}

