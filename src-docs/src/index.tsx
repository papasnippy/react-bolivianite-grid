import * as React from 'react';
import * as ReactDOM from 'react-dom';

// import { Store, createStore, applyMiddleware, compose } from 'redux';
// import ReduxThunk from 'redux-thunk';
// import { Provider } from 'react-redux';
import { App } from './components';

import './index.scss';

/*
let store: Store<any>;
let Reducers = {};

const history = createHistory();
const middlewares = applyMiddleware(ReduxThunk.withExtraArgument({}), routerMiddleware(history));

if (process.env.TARGET === 'development') {
    let w = window as any;
    let composeEnhancers = w.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
    store = createStore(Reducers, composeEnhancers(middlewares));
} else {
    store = createStore(Reducers, middlewares);
}
*/

ReactDOM.render((
    // <Provider store={store}>
    <App />
    // </Provider>
), document.getElementsByTagName('app')[0]);
