import { IGridTheme } from 'react-bolivianite-grid';

const REQUIRED_THEME: IGridTheme = {
    classNameScrollView: 'scrollview',
    styleGridColumns: {
        background: '#363944',
        boxShadow: '0 0 5px #000',
        color: '#DBDADD'
    },
    styleGridRows: {
        background: '#363944',
        boxShadow: '0 0 5px #000',
        color: '#DBDADD'
    },
    styleGridCorner: {
        borderRight: 'solid 1px #4d5160',
        borderBottom: 'solid 1px #4d5160',
        background: '#363944',
        color: '#DBDADD',
        boxSizing: 'border-box'
    }
};

const THEME = {
    ...REQUIRED_THEME,

    // Custom grid theme properties
    cellBackgroundEven: '#EFEFEF',
    cellBackgroundOdd: '#FFFFFF',
    headerBorderColor: '#4d5160',
    headerBackgroundColorSelected: '#24262d',
    selectionBackground: 'rgba(1, 9, 40, 0.2)',
    selectionBackgroundActive: 'transparent',
    selectionBorder: 'solid 1px #24262d',
    selectionBorderActive: 'solid 2px #24262d',
    resizerBackground: 'rgba(0, 0, 0, 0.4)',
    cellStyle: {
        boxSizing: 'border-box',
        borderRight: `solid 1px #BFBFBF`,
        borderBottom: `solid 1px #BFBFBF`,
        padding: '0 3px',
        display: 'flex',
        alignItems: 'center',
        color: '#211E26',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        cursor: 'default'
    } as React.CSSProperties,
    headerStyle: {
        boxSizing: 'border-box',
        borderRight: `solid 1px transparent`,
        borderBottom: `solid 1px transparent`,
        padding: 3,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        fontWeight: 'bold'
    } as React.CSSProperties
};

export default THEME;
