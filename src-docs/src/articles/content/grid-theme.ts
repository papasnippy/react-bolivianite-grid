import { IGridTheme } from 'react-bolivianite-grid';

const REQUIRED_THEME: IGridTheme = {
    // Scroller theme
    scrollbarWidth: 15,
    scrollbarWidthMinimized: 5,
    scrollbarMinimizeDistance: 100,
    styleTrackRoot: {
        transition: 'ease all 100ms',
        background: `rgba(0, 0, 0, 0.2)`
    },
    styleThumb: {
        background: `rgba(0, 0, 0, 0.8)`
    },

    // Grid theme
    style: {
        background: '#FFFFFF'
    },
    styleGridColumns: {
        background: '#3C3744',
        boxShadow: '0 0 5px #000',
        color: '#DBDADD'
    },
    styleGridRows: {
        background: '#3C3744',
        boxShadow: '0 0 5px #000',
        color: '#DBDADD'
    },
    styleGridCorner: {
        borderRight: 'solid 1px #000',
        borderBottom: 'solid 1px #000',
        background: '#3C3744',
        color: '#DBDADD',
        boxSizing: 'border-box'
    },
};

const THEME = {
    ...REQUIRED_THEME,

    // Custom grid theme properties
    cellTextColor: '#211E26',
    cellBorderColor: '#918B9C',
    cellBackgroundEven: '#EFEFEF',
    cellBackgroundOdd: '#FFFFFF',
    editorBorderColor: '#918B9C',
    editorBackground: '#FFFFFF',
    headerBorderColor: '#000000',
    headerBorderColorSelected: '#0F0126',
    headerBackgroundColorSelected: '#0F0126',
    selectionBackground: 'rgba(15, 1, 38, 0.2)',
    selectionBackgroundActive: 'transparent',
    selectionBorder: 'solid 1px #0F0126',
    selectionBorderActive: 'solid 2px #0F0126',
    resizerBackground: 'rgba(0, 0, 0, 0.4)'
};

export default THEME;
