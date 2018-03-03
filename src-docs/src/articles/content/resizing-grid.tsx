import * as React from 'react';
import Grid, {
    HeaderType, IHeaderRendererEvent, Resizer, IResizerRenderEvent, IGridResizeCombinedEvent
} from 'react-bolivianite-grid';
import EditableGrid from './editable-grid';
import Theme from './style';

export class ResizingGridExample extends EditableGrid {
    renderHeader = ({ style, type, selection, viewIndex, theme, header }: IHeaderRendererEvent) => {
        const nextStyle: React.CSSProperties = {
            ...style,
            ...theme.headerStyle
        };

        switch (type) {
            case HeaderType.Row:
                nextStyle.borderBottomColor = theme.headerBorderColor;

                // viewIndex is undefined for parent headers, it will be covered later
                if (viewIndex == null) {
                    nextStyle.borderRightColor = theme.headerBorderColor;
                }
                break;

            case HeaderType.Column:
                nextStyle.borderRightColor = theme.headerBorderColor;

                // viewIndex is undefined for parent headers, it will be covered later
                if (viewIndex == null) {
                    nextStyle.borderBottomColor = theme.headerBorderColor;
                }
                break;
        }

        if (selection) {
            nextStyle.background = theme.headerBackgroundColorSelected;
        }

        nextStyle.justifyContent = type === HeaderType.Row ? 'flex-end' : 'center';

        return (
            <div style={nextStyle}>
                {
                    type === HeaderType.Column && viewIndex != null
                        ? this.excelIndex(viewIndex)
                        : viewIndex
                }
                <Resizer header={header} />
            </div>
        );
    }

    renderResizer = ({ style, theme }: IResizerRenderEvent) => {
        style.background = theme.resizerBackground;
        return (
            <div style={style} />
        );
    }

    resizeHeaders = ({ headers, levels, behavior }: IGridResizeCombinedEvent) => {
        const state = this.currentState;
        let next = state.headers;

        if (headers) {
            next = next.resizeHeaders({
                behavior,
                list: headers,
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

        if (state.headers === next) {
            return;
        }

        this.pushHistory({ headers: next }, behavior === 'auto');
    }

    renderGrid() {
        const { data, headers } = this.currentState;
        return (
            <Grid
                headers={headers}
                overscanRows={3}
                source={data}
                theme={Theme}
                onRenderCell={this.renderCell}
                onRenderHeader={this.renderHeader}
                onRenderSelection={this.renderSelection}
                onRenderEditor={this.editorRenderer}
                onNullify={this.onNullify}
                onUpdate={this.onUpdate}
                onRenderResizer={this.renderResizer}
                onHeaderResize={this.resizeHeaders}
            />
        );
    }
}

export default ResizingGridExample;
