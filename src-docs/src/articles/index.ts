import Article from '~/app/article';
import Examples from './examples';
import Api from './api';

export default (
    Article('', 'Home')
        .append(Examples)
        .append(Api)
);
