import Article from '~/app/article';

export default (
    Article('api', 'Api')
        .append(
            Article('grid', 'Grid')
                .text(require('./api/grid.md'))
        )
        .append(
            Article('headers', 'Headers')
                .text(require('./api/headers.md'))
        )
        .append(
            Article('clipboard', 'Clipboard')
                .text(require('./api/clipboard.md'))
        )
);
