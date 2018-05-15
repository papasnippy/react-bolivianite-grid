import * as React from 'react';
import Grid, {
    Resizer, HeaderRepository, IHeader, IHeaderRendererEvent, HeaderType
} from 'react-bolivianite-grid';
import AutosizingExample from './autosizing-grid';
import Theme from './style';

export default class extends AutosizingExample {
    state = {
        history: [{
            data: new Map<string, string>(),
            repository: new HeaderRepository({
                columns: this.getHeaderTree('C', 4, 4, 4),
                rows: this.getHeaderTree('R', 10, 4, 2),
                columnWidth: 100,
                rowHeight: 24,
                headersHeight: 24,
                headersWidth: 60
            })
        }],
        index: 0
    };

    generateList(c: string, n: number, ct: { c?: number }, ch?: () => IHeader[]) {
        return new Array(n)
            .fill(null)
            .map((_v) => {
                ct.c = (ct.c || 0) + 1;
                let t = `${c} (${ct.c})`;
                return {
                    caption: t,
                    $children: ch ? ch() : null,
                    [c[0] === 'C' ? 'colIndex' : 'rowIndex']: t
                } as IHeader;
            });
    }

    getHeaderTree(s: string, n1: number, n2: number, n3: number) {
        const l1 = {}, l2 = {}, l3 = {};

        return this.generateList(`${s}1`, n1, l1, () => {
            return this.generateList(`${s}2`, n2, l2, () => {
                return this.generateList(`${s}3`, n3, l3);
            });
        });
    }

    /**
     * Note: viewIndex is undefined for parent headers
     */
    renderHeader = ({ style, type, selection, viewIndex, header, theme }: IHeaderRendererEvent) => {
        const nextStyle: React.CSSProperties = {
            ...style,
            ...theme.headerStyle
        };

        switch (type) {
            case HeaderType.Row:
                nextStyle.borderBottomColor = theme.headerBorderColor;

                if (viewIndex == null) {
                    nextStyle.borderRightColor = theme.headerBorderColor;
                }
                break;

            case HeaderType.Column:
                nextStyle.borderRightColor = theme.headerBorderColor;

                if (viewIndex == null) {
                    nextStyle.borderBottomColor = theme.headerBorderColor;
                }
                break;
        }

        if (selection) {
            nextStyle.background = theme.headerBackgroundColorSelected;
        }

        if (viewIndex != null) {
            nextStyle.justifyContent = type === HeaderType.Row ? 'flex-end' : 'center';
        } else {
            nextStyle.justifyContent = 'flex-start';
            nextStyle.alignItems = 'flex-start';
        }

        return (
            <div style={nextStyle}>
                {this.getHeaderCaption(header, type)}
                <Resizer header={header} />
            </div>
        );
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
                onAutoMeasure={this.autoMeasure}
            />
        );
    }
}

