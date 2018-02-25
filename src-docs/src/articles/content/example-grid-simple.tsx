import * as React from 'react';

import Grid, {
    HeadersContainer, HeaderType, ICellRendererEvent, IHeaderRendererEvent, ISelectionRendererEvent
} from 'react-bolivianite-grid';

import Theme from './grid-theme';


export class Example extends React.Component {
    state = {
        data: {} as {
            [key: string]: string;
        },
        headers: new HeadersContainer({
            columns: new Array(100).fill(null).map(() => ({})),
            rows: new Array(200).fill(null).map(() => ({})),
            columnWidth: 100,
            rowHeight: 24,
            headersHeight: 24,
            headersWidth: 50
        })
    };

    excelIndex(index: number) {
        index++;
        let c = '';

        for (let a = 1, b = 26; (index -= a) >= 0; a = b, b *= 26) {
            c = String.fromCharCode(~~((index % b) / a) + 65) + c;
        }

        return c;
    }

    renderCell = ({ style, columnIndex, rowIndex, source, theme }: ICellRendererEvent) => {
        let key = `${rowIndex} x ${columnIndex}`;
        let display = source[key] === void 0 ? key : source[key];

        return (
            <div
                style={{
                    ...style,
                    boxSizing: 'border-box',
                    borderRight: `solid 1px ${theme.cellBorderColor}`,
                    borderBottom: `solid 1px ${theme.cellBorderColor}`,
                    padding: '0 3px',
                    display: 'flex',
                    alignItems: 'center',
                    color: theme.cellTextColor,
                    background: (
                        rowIndex % 2
                            ? theme.cellBackgroundEven
                            : theme.cellBackgroundOdd
                    )
                }}
            >
                {display}
            </div>
        );
    }

    renderHeader = ({ style, type, selection, viewIndex, theme }: IHeaderRendererEvent) => {
        let rcolor = (
            type === HeaderType.Row && selection
                ? theme.headerBorderColorSelected
                : theme.headerBorderColor
        );

        let bcolor = (
            type === HeaderType.Column && selection
                ? theme.headerBorderColorSelected
                : theme.headerBorderColor
        );

        let nextStyle: React.CSSProperties = {
            ...style,
            boxSizing: 'border-box',
            borderRight: `solid 1px ${rcolor}`,
            borderBottom: `solid 1px ${bcolor}`,
            padding: '0 3px',
            display: 'flex',
            alignItems: 'center'
        };

        if (selection) {
            nextStyle.backgroundColor = theme.headerBackgroundColorSelected;
        }

        if (type === HeaderType.Row) {
            nextStyle.justifyContent = 'flex-end';
        }

        return (
            <div style={nextStyle}>
                {
                    type === HeaderType.Column && viewIndex != null
                        ? this.excelIndex(viewIndex)
                        : viewIndex
                }
            </div>
        );
    }

    renderSelection = ({ key, style, active, edit, theme }: ISelectionRendererEvent) => {
        style.left--;
        style.top--;
        style.width++;
        style.height++;

        return (
            <div
                key={key}
                style={{
                    ...style,
                    boxSizing: 'border-box',
                    backgroundColor: (active || edit) ? theme.selectionBackgroundActive : theme.selectionBackground,
                    border: active ? theme.selectionBorderActive : theme.selectionBorder
                }}
            />
        );
    }

    render() {
        return (
            <Grid
                readOnly
                headers={this.state.headers}
                overscanRows={3}
                source={this.state.data}
                theme={Theme}
                onRenderCell={this.renderCell}
                onRenderHeader={this.renderHeader}
                onRenderSelection={this.renderSelection}
            />
        );
    }
}

export default Example;
