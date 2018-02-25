import Article from './index';

export default Article.create('examples', [{
    name: '',
    caption: 'Fallback',
    body: [
        require('./examples-test.md')
    ]
}, {
    name: 'test1',
    caption: 'Test 1',
    body: [
        require('./examples-test.md'),
        Article.example({
            height: 600,
            example: 'test.tsx',
            files: [
                'test.tsx',
                ['test.txt', 'text'],
                ['test.scss', 'css']
            ]
        }),
        Article.example({
            height: 600,
            example: 'test.tsx',
            files: [
                'test.tsx',
                ['test.txt', 'text'],
                ['test.scss', 'css']
            ]
        })
    ]
}]);
