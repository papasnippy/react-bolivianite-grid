export interface IArticleItem {
    url: string;
    caption: string;
    body: string;
    deep: number;
    isGroup: boolean;
}

export type IArticleMap = IArticleItem[];

export class ArticleClass {
    public parent: ArticleClass = null;
    public children: ArticleClass[] = [];

    constructor(public address: string, public caption = '', public text = '', public isGroup = false) { }

    public get url() {
        let seek: ArticleClass = this;
        let url: string[] = [];

        do {
            url.unshift(seek.address);
        } while (seek = seek.parent);

        let o = url.join('/');

        if (o[0] === '/') {
            o = o.substr(1);
        }

        return o;
    }

    public get map() {
        return this._createList();
    }

    private _createList(out: IArticleMap = [], deep = -1) {
        out.push({
            url: this.url,
            caption: this.caption,
            body: this.text,
            deep: Math.max(0, deep),
            isGroup: this.isGroup
        });

        this.children.forEach((node) => {
            node._createList(out, node.isGroup ? deep : deep + 1);
        });

        return out;
    }

    public append(child: ArticleClass) {
        child.parent = this;
        this.children.push(child);
        return this;
    }
}

export function Article(address: string, caption?: string, text?: string) {
    return new ArticleClass(address, caption, text);
}

export function Group(address: string, caption?: string) {
    return new ArticleClass(address, caption, null, true);
}

export default Article;
