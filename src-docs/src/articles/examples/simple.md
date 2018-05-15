# Simple example of grid

First step is define header container object (repository). This repository must contain
all headers (rows and columns) and each header must implement [IHeader](/api/headers#IHeader) interface.

Each header can contain `$id` property - unique header identifier.
This identifier must be unique for all row and column headers.
If this property is omitted, [HeaderRepository](/api/headers) will assign indices automatically.
Note, that in this case this will be mutation.

Grid does not render headers and cells itself, you must implement render functions and provide
it to the component.

```app.example
{
    "main": "simple-grid.tsx",
    "files": [
        ["simple-grid.tsx", "javascript", "main.tsx"],
        ["style.ts", "typescript"]
    ]
}
```