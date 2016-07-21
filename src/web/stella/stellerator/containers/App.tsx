// tslint:disable-next-line
import * as React from 'react';

import Navbar from './Navbar';

import EmulationServiceInterface from '../../service/EmulationServiceInterface';

function App(emulationService: EmulationServiceInterface) {
    class App
        extends React.Component<App.Props, {}>
        implements React.ChildContextProvider<App.Context>
    {
        getChildContext(): App.Context {
            return {
                emulationService
            };
        }

        render() {
            return <div>
                <Navbar/>

                {this.props.children}
            </div>;
        }

        static childContextTypes: React.ValidationMap<any> = {
            emulationService: React.PropTypes.object
        };
    }

    return App;
}

module App {

    export interface Props {
        children: Array<React.ReactNode>;
    }

    export interface Context {
        emulationService: EmulationServiceInterface;
    }

}

export default App;
