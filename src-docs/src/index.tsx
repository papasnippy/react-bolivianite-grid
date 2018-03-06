import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HashRouter as Router } from 'react-router-dom';
import App from './app';
import Article from './articles';
import './index.scss';

const source = Article.map;

ReactDOM.render((
    <Router>
        <App source={source} />
    </Router>
), document.getElementsByTagName('app')[0]);
