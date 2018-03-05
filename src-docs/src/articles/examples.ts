import Article from './index';

export default Article.create('examples', [{
    // Index article
    name: '',
    caption: '',
    body: [
    ]
}, {
    name: 'simple',
    caption: 'Simple',
    body: [
        require('./text/example-simple.md'),
        Article.example({
            height: 600,
            main: 'simple-grid.tsx',
            files: [
                ['simple-grid.tsx', 'javascript'],
                ['style.ts', 'typescript']
            ]
        })
    ]
}, {
    name: 'editable',
    caption: 'Editable',
    body: [
        require('./text/example-editable.md'),
        Article.example({
            height: 600,
            main: 'editable-grid.tsx',
            files: [
                ['editable-grid.tsx', 'javascript'],
                ['base-example.tsx', 'javascript'],
                ['simple-editor.tsx', 'javascript'],
                ['style.ts', 'javascript'],
                ['style.scss', 'css']
            ]
        })
    ]
}, {
    name: 'resizing',
    caption: 'Resizing',
    body: [
        require('./text/example-resizing.md'),
        Article.example({
            height: 600,
            main: 'resizing-grid.tsx',
            files: [
                ['resizing-grid.tsx', 'javascript'],
                ['editable-grid.tsx', 'javascript'],
                ['base-example.tsx', 'javascript'],
                ['simple-editor.tsx', 'javascript'],
                ['style.ts', 'javascript'],
                ['style.scss', 'css']
            ]
        })
    ]
}, {
    name: 'autosizing',
    caption: 'Autosizing',
    body: [
        require('./text/example-autosizing.md'),
        Article.example({
            height: 600,
            main: 'autosizing-grid.tsx',
            files: [
                ['autosizing-grid.tsx', 'javascript'],
                ['resizing-grid.tsx', 'javascript'],
                ['editable-grid.tsx', 'javascript'],
                ['base-example.tsx', 'javascript'],
                ['simple-editor.tsx', 'javascript'],
                ['style.ts', 'javascript'],
                ['style.scss', 'css']
            ]
        })
    ]
}, {
    name: 'grouped-headers',
    caption: 'Grouped headers',
    body: [
        require('./text/example-grouped-headers.md'),
        Article.example({
            height: 600,
            main: 'grouped-headers-grid.tsx',
            files: [
                ['grouped-headers-grid.tsx', 'javascript'],
                ['autosizing-grid.tsx', 'javascript'],
                ['resizing-grid.tsx', 'javascript'],
                ['editable-grid.tsx', 'javascript'],
                ['base-example.tsx', 'javascript'],
                ['simple-editor.tsx', 'javascript'],
                ['style.ts', 'javascript'],
                ['style.scss', 'css']
            ]
        })
    ]
}, {
    name: 'expand-collapse',
    caption: 'Expand/Collapse',
    body: [
        require('./text/example-expand-collapse.md'),
        Article.example({
            height: 600,
            main: 'expand-collapse-grid.tsx',
            files: [
                ['expand-collapse-grid.tsx', 'javascript'],
                ['grouped-headers-grid.tsx', 'javascript'],
                ['autosizing-grid.tsx', 'javascript'],
                ['resizing-grid.tsx', 'javascript'],
                ['editable-grid.tsx', 'javascript'],
                ['base-example.tsx', 'javascript'],
                ['simple-editor.tsx', 'javascript'],
                ['style.ts', 'javascript'],
                ['style.scss', 'css']
            ]
        })
    ]
}, {
    name: 'copy-paste',
    caption: 'Copy and paste',
    body: [
        require('./text/example-copy-paste.md'),
        Article.example({
            height: 600,
            main: 'copy-paste-grid.tsx',
            files: [
                ['copy-paste-grid.tsx', 'javascript'],
                ['expand-collapse-grid.tsx', 'javascript'],
                ['grouped-headers-grid.tsx', 'javascript'],
                ['autosizing-grid.tsx', 'javascript'],
                ['resizing-grid.tsx', 'javascript'],
                ['editable-grid.tsx', 'javascript'],
                ['base-example.tsx', 'javascript'],
                ['simple-editor.tsx', 'javascript'],
                ['style.ts', 'javascript'],
                ['style.scss', 'css']
            ]
        })
    ]
}]);
