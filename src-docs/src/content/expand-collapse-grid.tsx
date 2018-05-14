import * as React from 'react';
import {
    Resizer, IHeaderRendererEvent, HeaderType
} from 'react-bolivianite-grid';
import GroupedHeadersExample from './grouped-headers-grid';

export default class extends GroupedHeadersExample {
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

                            let { data, headers } = this.currentState;

                            headers = headers.updateHeaders([{
                                header,
                                update: {
                                    $collapsed: !header.$collapsed
                                }
                            }]);

                            this.pushHistory({
                                data, headers
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
