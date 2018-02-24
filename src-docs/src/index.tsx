import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HashRouter as Router } from 'react-router-dom';
import { App } from './components';

import './index.scss';

['test1.txt', 'test2.txt'].forEach((fileName) => {
    const content = require('raw-loader!~/article/' + fileName);
    console.log({ fileName, content });
});

ReactDOM.render((
    <Router>
        <App />
    </Router>
), document.getElementsByTagName('app')[0]);
