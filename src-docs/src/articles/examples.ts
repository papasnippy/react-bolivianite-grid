import Article from '~/app/article';

export default (
    Article('examples', 'Examples')
        .append(
            Article('simple', 'Simple')
                .text(require('./examples/simple.md'))
                .example('simple-grid.tsx', [
                    ['simple-grid.tsx', 'javascript', 'main.tsx'],
                    ['style.ts', 'typescript']
                ])
        )
        .append(
            Article('editable', 'Editable')
                .text(require('./examples/editable.md'))
                .example('editable-grid.tsx', [
                    ['editable-grid.tsx', 'javascript', 'main.tsx'],
                    ['base-example.tsx', 'javascript'],
                    ['simple-editor.tsx', 'javascript'],
                    ['style.ts', 'javascript'],
                    ['style.scss', 'css']
                ])
        )
        .append(
            Article('resizing', 'Resizing')
                .text(require('./examples/resizing.md'))
                .example('resizing-grid.tsx', [
                    ['resizing-grid.tsx', 'javascript', 'main.tsx'],
                    ['base-example.tsx', 'javascript'],
                    ['simple-editor.tsx', 'javascript'],
                    ['style.ts', 'javascript'],
                    ['style.scss', 'css']
                ])
        )
        .append(
            Article('autosizing', 'Autosizing')
                .text(require('./examples/autosizing.md'))
                .example('autosizing-grid.tsx', [
                    ['autosizing-grid.tsx', 'javascript', 'main.tsx'],
                    ['base-example.tsx', 'javascript'],
                    ['simple-editor.tsx', 'javascript'],
                    ['style.ts', 'javascript'],
                    ['style.scss', 'css']
                ])
        )
        .append(
            Article('grouped-headers', 'Grouped headers')
                .text(require('./examples/grouped-headers.md'))
                .example('grouped-headers-grid.tsx', [
                    ['grouped-headers-grid.tsx', 'javascript', 'main.tsx'],
                    ['base-example.tsx', 'javascript'],
                    ['simple-editor.tsx', 'javascript'],
                    ['style.ts', 'javascript'],
                    ['style.scss', 'css']
                ])
        )
        .append(
            Article('expand-collapse', 'Expand/Collapse')
                .text(require('./examples/expand-collapse.md'))
                .example('expand-collapse-grid.tsx', [
                    ['expand-collapse-grid.tsx', 'javascript', 'main.tsx'],
                    ['base-example.tsx', 'javascript'],
                    ['simple-editor.tsx', 'javascript'],
                    ['style.ts', 'javascript'],
                    ['style.scss', 'css']
                ])
        )
        .append(
            Article('clipboard', 'Copy and paste')
                .text(require('./examples/clipboard.md'))
                .example('copy-paste-grid.tsx', [
                    ['copy-paste-grid.tsx', 'javascript', 'main.tsx'],
                    ['base-example.tsx', 'javascript'],
                    ['simple-editor.tsx', 'javascript'],
                    ['style.ts', 'javascript'],
                    ['style.scss', 'css']
                ])
        )
);
