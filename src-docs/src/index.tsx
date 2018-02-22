import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HashRouter as Router } from 'react-router-dom';
import { App } from './components';

import './index.scss';

ReactDOM.render((
    <Router>
        <App />
    </Router>
), document.getElementsByTagName('app')[0]);
