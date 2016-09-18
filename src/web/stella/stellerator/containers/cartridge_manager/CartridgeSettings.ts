import {connect} from 'react-redux';

import {
    changeCartridgeType,
    changePaddleEmulation,
    changeName,
    changeTvMode,
    changeRngSeedStrategy,
    changeRngSeed,
    toggleAudioEnabled
} from '../../actions/currentCartridge';

import {saveCurrentCartride} from '../../actions/root';
import CartridgeSettingsComponent from '../../components/cartridge_manager/CartridgeSettings';
import State from '../../state/State';

import StellaConfig from '../../../../../machine/stella/Config';
import CartridgeInfo from '../../../../../machine/stella/cartridge/CartridgeInfo';

function mapStateToProps(state: State): CartridgeSettingsComponent.Props {
    return {
        name: state.currentCartridge ? state.currentCartridge.name : '',
        tvMode: state.currentCartridge ? state.currentCartridge.tvMode : StellaConfig.TvMode.ntsc,
        cartridgeType: state.currentCartridge ? state.currentCartridge.cartridgeType : CartridgeInfo.CartridgeType.unknown,
        emulatePaddles: state.currentCartridge ? state.currentCartridge.emulatePaddles : true,
        visible: !!state.currentCartridge,
        rngSeedAuto: state.currentCartridge ? state.currentCartridge.rngSeedAuto : true,
        rngSeedValue: state.currentCartridge ? state.currentCartridge.rngSeed : 0,
        audioEnabled: state.currentCartridge ? state.currentCartridge.audioEnabled : true
    };
}

const CartridgeSettingsContainer = connect(
    mapStateToProps, {
        onNameChange: changeName,
        onKeyEnter: saveCurrentCartride,
        onTvModeChange: changeTvMode,
        onCartridgeTypeChange: changeCartridgeType,
        onTogglePaddleEmulation: changePaddleEmulation,
        onChangeSeedStrategy: changeRngSeedStrategy,
        onChangeSeedValue: changeRngSeed,
        onToggleAudioEnabled: toggleAudioEnabled
    }
)(CartridgeSettingsComponent);
export default CartridgeSettingsContainer;
