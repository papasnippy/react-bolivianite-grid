import * as React from 'react';
import {
    Resizer, IHeaderRendererEvent, HeaderType, IHeader
} from 'react-bolivianite-grid';
import GroupedHeadersExample from './grouped-headers-grid';

export default class extends GroupedHeadersExample {
    measureHeader(header: IHeader, type: HeaderType, ctx: CanvasRenderingContext2D) {
        const text = this.getHeaderCaption(header, type);
        let width = ctx.measureText(String(text)).width;

        // Headers has caption like this: [C|R][1|2|3][ ][(] ...
        // Caption with char at index 1 with value '1' and '2' has expand/collapse button
        // with width+margin around 20px. Not a battle ready solution, just example.
        if (text[1] !== '3') {
            width += 20;
        }

        return width;
    }

    renderHeader = ({ style, type, selection, header, theme }: IHeaderRendererEvent) => {
        const nextStyle: React.CSSProperties = {
            ...style,
            ...theme.headerStyle,
            justifyContent: 'flex-start',
            alignItems: 'flex-start'
        };

        const isParent = !header.$collapsed && header.$children && header.$children.length;

        switch (type) {
            case HeaderType.Row:
                nextStyle.borderBottomColor = theme.headerBorderColor;
                nextStyle.borderRightColor = isParent ? theme.headerBorderColor : 'transparent';
                break;

            case HeaderType.Column:
                nextStyle.borderRightColor = theme.headerBorderColor;
                nextStyle.borderBottomColor = isParent ? theme.headerBorderColor : 'transparent';
                break;
        }

        if (selection) {
            nextStyle.background = theme.headerBackgroundColorSelected;
        }

        return (
            <div style={nextStyle}>
                {header.$children && header.$children.length &&
                    <button
                        style={{
                            cursor: 'pointer',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 0,
                            borderRadius: 3,
                            color: '#FFFFFF',
                            marginBottom: 3,
                            marginRight: 3,
                            height: 18
                        }}
                        onMouseDown={(e) => {
                            // stop grid from selecting
                            e.stopPropagation();
                            e.preventDefault();

                            let { data, repository } = this.currentState;

                            repository = repository.updateHeaders([{
                                header,
                                update: {
                                    $collapsed: !header.$collapsed
                                }
                            }]);

                            this.pushHistory({
                                data, repository
                            });
                        }}
                    >
                        {header.$collapsed ? '+' : '-'}
                    </button>
                }
                {header.caption}
                <Resizer header={header} />
            </div>
        );
    }
}
