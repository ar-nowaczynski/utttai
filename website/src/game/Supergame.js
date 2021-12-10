import React from 'react';
import Subgame from './Subgame';

class Supergame extends React.PureComponent {
  renderSubgame(subgame) {
    const { uttt, prevAction, evaluatedActionsGrouped, settings, isEvaluationVisible, updateGameline } = this.props;
    return (
      <Subgame
        subgame={subgame}
        uttt={uttt}
        prevAction={prevAction}
        evaluatedSubgameActions={evaluatedActionsGrouped[subgame]}
        settings={settings}
        isEvaluationVisible={isEvaluationVisible}
        updateGameline={updateGameline}
      />
    );
  }

  render() {
    return (
      <div className="supergame">
        <div className="subgames-row top">
          <div className="subgames-column left">{this.renderSubgame(0)}</div>
          <div className="subgames-column center">{this.renderSubgame(1)}</div>
          <div className="subgames-column right">{this.renderSubgame(2)}</div>
        </div>
        <div className="subgames-row middle">
          <div className="subgames-column left">{this.renderSubgame(3)}</div>
          <div className="subgames-column center">{this.renderSubgame(4)}</div>
          <div className="subgames-column right">{this.renderSubgame(5)}</div>
        </div>
        <div className="subgames-row bottom">
          <div className="subgames-column left">{this.renderSubgame(6)}</div>
          <div className="subgames-column center">{this.renderSubgame(7)}</div>
          <div className="subgames-column right">{this.renderSubgame(8)}</div>
        </div>
      </div>
    );
  }
}

export default Supergame;
