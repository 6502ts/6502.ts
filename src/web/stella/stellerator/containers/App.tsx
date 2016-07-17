// tslint:disable-next-line
import * as React from 'react';

import Navbar from './Navbar';

interface Props {
    children: Array<React.ReactNode>;
}

export default function App(props: Props) {
    return <div>
        <Navbar/>

        {props.children}
    </div>;
}
