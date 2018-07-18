import * as React from 'react';
import Grid, {
    HeaderType, IHeaderRendererEvent, Resizer, IResizerRenderEvent, IGridResizeCombinedEvent
} from 'react-bolivianite-grid';
import CopyPasteExample from './copy-paste-grid';
import Theme from './style';

export default class extends CopyPasteExample {
    renderAdditionalHeaderContent ({ header }: IHeaderRendererEvent) {
        return (
            <Resizer header={header} />
        );
    }

    /** Rendering resizing indicator. */
    renderResizer = ({ style, theme, resizer, orientation }: IResizerRenderEvent) => {
        return (
            <div
                style={{
                    ...style,
                    ...(
                        resizer === 'initial'
                            ? theme.resizer
                            : orientation === 'horizontal'
                                ? theme.resizerChangeH
                                : theme.resizerChangeV
                    )
                }}
            />
        );
    }

    /** Update header repository on resize. */
    resizeHeaders = ({ headers, levels, behavior }: IGridResizeCombinedEvent) => {
        const state = this.currentState;
        let next = state.repository;

        if (headers) {
            next = next.resizeHeaders({
                behavior, headers,
                clamp: ({ type, size }) => Math.max(size, type === HeaderType.Column ? 30 : 24)
            });
        }

        if (levels) {
            next = next.resizeLevels({
                behavior,
                levels: levels.map(({ level, size, type }) => {
                    return {
                        type, level, size,
                        min: type === HeaderType.Column ? 25 : 30
                    };
                })
            });
        }

        if (state.repository === next) {
            return;
        }

        this.pushHistory({ repository: next }, behavior === 'auto');
    }

    renderGrid() {
        const { data, repository } = this.currentState;
        return (
            <Grid
                repository={repository}
                overscanRows={3}
                data={data}
                theme={Theme}
                onRenderCell={this.renderCell}
                onRenderHeader={this.renderHeader}
                onRenderSelection={this.renderSelection}
                onRenderEditor={this.editorRenderer}
                onNullify={this.onNullify}
                onUpdate={this.onUpdate}
                onCopy={this._cpb.onCopy}
                onPaste={this._cpb.onPaste}
                onRenderResizer={this.renderResizer}
                onHeaderResize={this.resizeHeaders}
            />
        );
    }
}

