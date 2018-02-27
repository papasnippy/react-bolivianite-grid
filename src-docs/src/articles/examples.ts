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
        require('./example-simple.md'),
        Article.example({
            height: 600,
            example: 'example-grid-simple.tsx',
            files: [
                ['example-grid-simple.tsx', 'javascript', 'main.tsx'],
                ['style.ts', 'typescript']
            ]
        })
    ]
}, {
    name: 'editable',
    caption: 'Editable',
    body: [
        require('./example-editable.md'),
        Article.example({
            height: 600,
            example: 'example-grid-editable.tsx',
            files: [
                ['example-grid-editable.tsx', 'javascript', 'main.tsx'],
                ['base-example.tsx', 'javascript'],
                ['simple-editor.tsx', 'javascript'],
                ['style.ts', 'javascript'],
                ['style.scss', 'css']
            ]
        })
    ]
}]);
