import * as React from 'react';
import { Toolbar, MenuItem, GitHubIcon } from './ui';
const Style = require('./app.scss');

export class App extends React.Component<any, any> {
    public render() {
        return (
            <div className={Style.root}>
                <Toolbar>
                    <div>
                        <MenuItem selected>
                            Home
                        </MenuItem>
                        <MenuItem>
                            Examples
                        </MenuItem>
                        <MenuItem>
                            Tutorial
                        </MenuItem>
                        <MenuItem>
                            Api
                        </MenuItem>
                    </div>
                    <div>
                        <a target="blank" href="https://github.com/papasnippy/react-bolivianite-grid">
                            <GitHubIcon />
                        </a>
                    </div>
                </Toolbar>
                <div className={Style.content}>
                </div>
            </div>
        );
    }
}
