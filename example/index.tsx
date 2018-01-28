import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Example from './example';

const div = document.createElement('div');
document.body.appendChild(div);

ReactDOM.render(<Example />, div);
