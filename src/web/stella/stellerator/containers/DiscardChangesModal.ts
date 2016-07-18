import {connect} from 'react-redux';

import {
    closePendingChangesModal
} from '../actions/guiState';

import {
    batch,
    saveCurrentCartride,
    selectCartridge
} from '../actions/root';

import State from '../state/State';
import DiscardChangesModalComponent from '../components/DiscardChangesModal';

function mapStateToProps(state: State): DiscardChangesModalComponent.Props {
    return {
        show: state.guiState.showDiscardChangesModel
    };
}

const DiscardChangesModalContainer = connect(
    mapStateToProps,
    {
        onHide: ()=> closePendingChangesModal(),
        onContinueAndDiscard: () => batch(
            selectCartridge(),
            closePendingChangesModal()
        ),
        onContinueAndSave: () => batch(
            saveCurrentCartride(),
            selectCartridge(),
            closePendingChangesModal()
        )
    }
)(DiscardChangesModalComponent);

export default DiscardChangesModalContainer;
