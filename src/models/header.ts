export class Header {
    public position = 0;

    constructor(
        /**
         * If size is 0 - it will be overriden with columnWidth or rowHeight.
         */
        public size = 0,
        public parent: Header = null,
        public children: Header[] = null
    ) {
        if (parent) {
            if (!parent.children) {
                parent.children = [];
            }

            parent.children.push(this);
        }
    }
}

