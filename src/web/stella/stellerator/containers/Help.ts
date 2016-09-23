import {connect} from 'react-redux';

import HelpComponent from '../components/Help';
import State from '../state/State';

function mapStateToProps(state: State): HelpComponent.Props {
    return {
        helppageUrl: state.environment.helppageUrl,
        buildId: state.environment.buildId
    };
}

const HelpContainer = connect(mapStateToProps)(HelpComponent);

export default HelpContainer;