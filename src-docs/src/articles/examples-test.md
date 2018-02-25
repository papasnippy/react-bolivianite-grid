# test 1 content

test

- a
- b
- c

`inline code`

```
private _renderArticle(body: (string | ICodeViewProps)[]): JSX.Element[] {
    return body.map((p, i) => {
        if (typeof p === 'string') {
            return (
                <div
                    className={Style.chunk}
                    key={i}
                >
                    <Markdown source={(p || '').trim()} />
                </div>
            );
        }

        const { files, example, height } = p;

        return (
            <CodeView
                className={Style.chunk}
                key={i}
                files={files}
                example={example}
                height={height}
            />
        );
    });
}
```
