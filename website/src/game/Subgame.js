import React from 'react';
import { joinClassNames } from '../global/classnames';
import Square from './Square';
import SymbolXIcon from '../images/symbol-x.svg';
import SymbolOIcon from '../images/symbol-o.svg';
import SymbolDrawIcon from '../images/symbol-draw.svg';

class Subgame extends React.PureComponent {
  renderSquare(index) {
    const { uttt, prevAction, evaluatedSubgameActions, settings, isEvaluationVisible, updateGameline } = this.props;
    return (
      <Square
        index={index}
        uttt={uttt}
        prevAction={prevAction}
        evaluatedAction={evaluatedSubgameActions ? evaluatedSubgameActions[index] : undefined}
        settings={settings}
        isEvaluationVisible={isEvaluationVisible}
        updateGameline={updateGameline}
      />
    );
  }

  render() {
    const { subgame, uttt } = this.props;
    let subgameResultClassName, subgameResultIcon;
    if (uttt.isSubgameTerminated(subgame)) {
      if (uttt.isSubgameResultX(subgame)) {
        subgameResultClassName = 'result x';
        subgameResultIcon = <SymbolXIcon className="result-icon x" />;
      } else if (uttt.isSubgameResultO(subgame)) {
        subgameResultClassName = 'result o';
        subgameResultIcon = <SymbolOIcon className="result-icon o" />;
      } else if (uttt.isSubgameResultDraw(subgame)) {
        subgameResultClassName = 'result draw';
        subgameResultIcon = <SymbolDrawIcon className="result-icon draw" />;
      }
    }
    const offset = subgame * 9;
    return (
      <div className={joinClassNames('subgame', subgameResultClassName)}>
        {subgameResultIcon}
        <div className="squares-row top">
          <div className="squares-column left">{this.renderSquare(offset + 0)}</div>
          <div className="squares-column center">{this.renderSquare(offset + 1)}</div>
          <div className="squares-column right">{this.renderSquare(offset + 2)}</div>
        </div>
        <div className="squares-row middle">
          <div className="squares-column left">{this.renderSquare(offset + 3)}</div>
          <div className="squares-column center">{this.renderSquare(offset + 4)}</div>
          <div className="squares-column right">{this.renderSquare(offset + 5)}</div>
        </div>
        <div className="squares-row bottom">
          <div className="squares-column left">{this.renderSquare(offset + 6)}</div>
          <div className="squares-column center">{this.renderSquare(offset + 7)}</div>
          <div className="squares-column right">{this.renderSquare(offset + 8)}</div>
        </div>
      </div>
    );
  }
}

export default Subgame;
