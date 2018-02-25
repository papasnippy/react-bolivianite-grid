import { ICodeViewProps } from '~/components/ui';

export interface IArticle {
    name: string;
    caption: string;
    body: (string | ICodeViewProps)[];
}

export interface IArticlesSource {
    url: string;
    articles: IArticle[];
}


export namespace Article {
    export function create(url: string, articles: IArticle[]): IArticlesSource {
        return { url, articles };
    }

    export function example(props: ICodeViewProps) {
        return props;
    }
}

export default Article;
