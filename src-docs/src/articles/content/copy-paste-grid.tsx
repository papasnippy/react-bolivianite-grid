import * as React from 'react';
import * as PapaParse from 'papaparse';
import Grid, {
    CopyPasteController
    // HeadersContainer, Resizer, IHeaderRendererEvent, HeaderType, ICellMeasureResult,
    // ICellsMeasureEvent, IGridUpdateEvent, IGridNullifyEvent
} from 'react-bolivianite-grid';
import ExpandCollapseExample from './expand-collapse-grid';
import Theme from './style';

export class CopyPasteExample extends ExpandCollapseExample {
    private _cp: CopyPasteController;

    constructor(_p: any, _c: any) {
        super(_p, _c);

        this._cp = new CopyPasteController({
            renderHeader: ({ header }) => {
                return header.caption;
            },
            renderCell: ({ cell, source }) => {
                return this.renderCellValue(cell.column, cell.row, source);
            },
            clipboardParser: (transfer) => {
                let text = transfer.getData('Text') || '';
                let { data } = PapaParse.parse(text, { delimiter: '\t' });
                return data || [];
            },
            cellParser: ({ value }) => {
                return value;
            },
            onInvalidSelection: () => {
                alert(`Impossible to copy current selection.`);
            },
            onCopy: ({ table, focus }) => {
                let data = PapaParse.unparse(table, { delimiter: '\t' });

                let ta = document.createElement('textarea');
                ta.style.position = 'fixed';
                ta.style.top = '200vh';
                ta.value = data;

                document.body.appendChild(ta);
                ta.select();

                let success = document.execCommand('Copy');
                document.body.removeChild(ta);
                focus();

                if (!success) {
                    alert('Failed to copy current selection.');
                }
            },
            onPaste: ({ changes }) => {
                let { data, headers } = this.currentState;
                data = { ...data };

                changes.forEach(({ column, row, value }) => {
                    if (!headers.rows[row] || !headers.columns[column]) {
                        return;
                    }

                    const c = headers.columns[column].caption;
                    const r = headers.rows[row].caption;
                    const key = `${r} x ${c}`;
                    data[key] = value;
                });

                this.pushHistory({ data, headers });
            }
        });
    }

    renderGrid() {
        const { data, headers } = this.currentState;
        return (
            <Grid
                headers={headers}
                overscanRows={3}
                source={data}
                theme={Theme}
                onRenderCell={this.renderCell}
                onRenderHeader={this.renderHeader}
                onRenderSelection={this.renderSelection}
                onRenderEditor={this.editorRenderer}
                onNullify={this.onNullify}
                onUpdate={this.onUpdate}
                onRenderResizer={this.renderResizer}
                onHeaderResize={this.resizeHeaders}
                onAutoMeasure={this.autoMeasure}
                onCopy={this._cp.onCopy}
                onPaste={this._cp.onPaste}
            />
        );
    }
}

export default CopyPasteExample;
