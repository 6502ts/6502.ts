import {connect} from 'react-redux';

import NavbarComponent from '../components/Navbar';
import State from '../state/State';
import GuiState from '../state/GuiState';

function mapStateToProps(state: State): NavbarComponent.Props {
    return {
        linkEmulation: state.guiState.mode === GuiState.GuiMode.run
    };
}

const NavbarContainer = connect(mapStateToProps, {})(NavbarComponent);

export default NavbarContainer;
