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
            main: 'simple-grid.tsx',
            files: [
                ['simple-grid.tsx', 'javascript', 'main.tsx'],
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
            main: 'editable-grid.tsx',
            files: [
                ['editable-grid.tsx', 'javascript', 'main.tsx'],
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
            main: 'resizing-grid.tsx',
            files: [
                ['resizing-grid.tsx', 'javascript', 'main.tsx'],
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
            main: 'autosizing-grid.tsx',
            files: [
                ['autosizing-grid.tsx', 'javascript', 'main.tsx'],
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
            main: 'grouped-headers-grid.tsx',
            files: [
                ['grouped-headers-grid.tsx', 'javascript', 'main.tsx'],
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
            main: 'expand-collapse-grid.tsx',
            files: [
                ['expand-collapse-grid.tsx', 'javascript', 'main.tsx'],
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
            main: 'copy-paste-grid.tsx',
            files: [
                ['copy-paste-grid.tsx', 'javascript', 'main.tsx'],
                ['base-example.tsx', 'javascript'],
                ['simple-editor.tsx', 'javascript'],
                ['style.ts', 'javascript'],
                ['style.scss', 'css']
            ]
        })
    ]
}]);
