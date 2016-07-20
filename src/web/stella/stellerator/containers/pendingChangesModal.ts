import {connect} from 'react-redux';
import {Action} from 'redux';

import {
    selectClosePendingChangesModal,
    loadClosePendingChangesModal
} from '../actions/guiState';

import {
    batch,
    registerNewCartridge,
    saveCurrentCartride,
    selectCartridge
} from '../actions/root';

import State from '../state/State';
import PendingChangesModalComponent from '../components/PendingChangesModal';

export const SelectPendingChangesModal = factory(
    (state: State) => state.guiState.showSelectPendingChangesModal,
    selectClosePendingChangesModal,
    selectCartridge
);

export const LoadPendingChangesModal = factory(
    (state: State) => state.guiState.showLoadPendingChangesModal,
    loadClosePendingChangesModal,
    registerNewCartridge
);

function factory(
    showModal: (s: State) => boolean,
    closeActionEmitter: () => Action,
    applyActionEmitter: () => Action
) {

    function mapStateToProps(state: State): PendingChangesModalComponent.Props {
        return {
            show: showModal(state)
        };
    }

    return connect(
        mapStateToProps,
        {
            onHide: () => closeActionEmitter(),
            onContinueAndDiscard: () => batch(
                applyActionEmitter(),
                closeActionEmitter()
            ),
            onContinueAndSave: () => batch(
                saveCurrentCartride(),
                applyActionEmitter(),
                closeActionEmitter()
            )
        }
    )(PendingChangesModalComponent);
}
