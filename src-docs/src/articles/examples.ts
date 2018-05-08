import Article from '~/app/article';

export default (
    Article('examples', 'Examples')
        .append(Article('simple', 'Simple').text(require('./examples/simple.md')))
        .append(Article('editable', 'Editable').text(require('./examples/editable.md')))
        .append(Article('filtering', 'Filtering').text(require('./examples/filtering.md')))
        .append(Article('resizing', 'Resizing').text(require('./examples/resizing.md')))
        .append(Article('autosizing', 'Autosizing').text(require('./examples/autosizing.md')))
        .append(Article('grouped-headers', 'Grouped headers').text(require('./examples/grouped-headers.md')))
        .append(Article('expand-collapse', 'Expand/Collapse').text(require('./examples/expand-collapse.md')))
        .append(Article('clipboard', 'Copy and paste').text(require('./examples/clipboard.md')))
);
