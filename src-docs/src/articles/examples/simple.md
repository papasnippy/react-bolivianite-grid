# Simple example of grid

Component uses two main properties: `repository` and `data`. First property is required and
it is a source for Grid component. You can even render table without providing `data` property.

Grid uses pair of headers to render each cell, for each pair you must return corresponding to it value.

Repository contains all headers: rows and columns.
Each header must implement [IHeader](/api/headers#IHeader) interface.

Header can contain `$id` property - unique header identifier.
This identifiers must be unique for all row and column headers.
If this property is omitted, [HeaderRepository](/api/headers) will assign this ids automatically.
Note, that in this case this will be a mutation of header objects.


```app.example
{
    "main": "simple-grid.tsx",
    "files": [
        ["simple-grid.tsx", "javascript", "main.tsx"],
        ["style.ts", "typescript"]
    ]
}
```