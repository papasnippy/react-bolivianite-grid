export interface IArticleItem {
    url: string;
    caption: string;
    body: string;
    deep: number;
}

export type IArticleMap = IArticleItem[];

export class Article {
    public parent: Article = null;
    public children: Article[] = [];

    constructor(public address: string, public caption = '', public text = '') { }

    public get url() {
        let seek: Article = this;
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
            deep: Math.max(0, deep)
        });

        this.children.forEach((node) => {
            node._createList(out, deep + 1);
        });

        return out;
    }

    public append(child: Article) {
        child.parent = this;
        this.children.push(child);
        return this;
    }
}

export function Create(address: string, caption?: string, text?: string) {
    return new Article(address, caption, text);
}

export default Create;
