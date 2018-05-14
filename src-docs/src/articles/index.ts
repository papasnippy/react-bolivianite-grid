import { Article, Group } from '~/app/article';

export default (
    Article('', 'Home', require('./index.md'))
        .append(
            Group('examples', 'Examples')
                .append(Article('simple', 'Simple', require('./examples/simple.md')))
                .append(Article('editable', 'Editable', require('./examples/editable.md')))
                .append(Article('copy-and-paste', 'Copy and paste', require('./examples/copy-and-paste.md')))
                .append(Article('filtering', 'Filtering', require('./examples/filtering.md')))
                .append(Article('resizing', 'Resizing', require('./examples/resizing.md')))
                .append(Article('autosizing', 'Autosizing', require('./examples/autosizing.md')))
                .append(Article('grouped-headers', 'Grouped headers', require('./examples/grouped-headers.md')))
                .append(Article('expand-collapse', 'Expand/Collapse', require('./examples/expand-collapse.md')))
        )
        .append(
            Group('api', 'Api')
                .append(Article('grid', 'Grid', require('./api/grid.md')))
                .append(Article('editor', 'Editor', require('./api/editor.md')))
                .append(Article('headers', 'Headers', require('./api/headers.md')))
                .append(Article('clipboard', 'Clipboard', require('./api/clipboard.md')))
        )
);
