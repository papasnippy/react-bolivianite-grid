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
        // require('./examples-test.md'),
        Article.example({
            height: 600,
            example: 'example-grid-simple.tsx',
            files: [
                ['example-grid-simple.tsx', 'javascript', 'main.tsx'],
                ['grid-theme.ts', 'typescript', 'theme.ts']
            ]
        })
    ]
}]);
