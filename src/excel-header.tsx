/**
 * http://cwestblog.com/2013/09/05/javascript-snippet-convert-number-to-column-name/
*/
function toName(n: number) {
    let ret = '';
    n++;

    for (let a = 1, b = 26; (n -= a) >= 0; a = b, b *= 26) {
        ret = String.fromCharCode(~~((n % b) / a) + 65) + ret;
    }

    return ret;
}

export function ExcelHeader({ type, index }: { type: 'rows' | 'columns', index: number }) {
    return type === 'columns' ? toName(index) : index + 1;
}
