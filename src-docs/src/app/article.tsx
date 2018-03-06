import { ICodeViewProps, ICodeViewFile } from './ui';

export interface IArticleText {
    type: 'text';
    data: string;
}

export interface IArticleExample {
    type: 'example';
    data: ICodeViewProps;
}

export interface IArticleComponent {
    type: 'component';
    data: () => JSX.Element;
}

export type TArticle = IArticleText | IArticleExample | IArticleComponent;

export interface IArticleItem {
    url: string;
    caption: string;
    body: TArticle[];
    deep: number;
}

export type IArticleMap = IArticleItem[];

export class Article {
    public parent: Article = null;
    public body: TArticle[] = [];
    public children: Article[] = [];

    constructor(public address: string, public caption = '') { }

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
            body: this.body,
            deep: Math.max(0, deep)
        });

        this.children.forEach((node) => {
            node._createList(out, deep + 1);
        });

        return out;
    }

    public text(text: string) {
        this.body.push({ type: 'text', data: text });
        return this;
    }

    public example(main: string, files?: ICodeViewFile[]) {
        files = files || [main];

        this.body.push({ type: 'example', data: { main, files } });
        return this;
    }

    public component(component: () => JSX.Element) {
        this.body.push({ type: 'component', data: component });
        return this;
    }

    public append(child: Article) {
        child.parent = this;
        this.children.push(child);
        return this;
    }
}

export function Create(address: string, caption?: string) {
    return new Article(address, caption);
}

export default Create;
