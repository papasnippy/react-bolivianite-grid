# Repository cache
Repository cache is a special instance of external storage for all header and level sizes.
Please examine [this interface](/api/headers#IHeaderRepositoryCache) for details.

Cache allows to store header sizes between multiple repositories. Useful for cases when you have rapidly
changing, dynamic repositories or when you have some different and similar header structures.

In this example we are using global cache, so you can edit table or column size, navigate to different
page and return back here. Also, we do not store column and row changes in change history here.

```app.example
{
    "main": "repository-cache.tsx",
    "files": [
        ["repository-cache.tsx", "javascript", "main.tsx"],
        ["autosizing-grid.tsx", "javascript"],
        ["resizing-grid.tsx", "javascript"],
        ["editable-grid.tsx", "javascript"],
        ["style.ts", "javascript"],
        ["style.scss", "css"]
    ]
}
```
