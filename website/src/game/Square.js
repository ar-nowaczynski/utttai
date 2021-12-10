import React from 'react';
import { joinClassNames } from '../global/classnames';
import { formatProbability } from '../global/formatting';
import { X_STATE_VALUE, O_STATE_VALUE } from './constants';
import Action from './Action';
import SymbolXIcon from '../images/symbol-x.svg';
import SymbolOIcon from '../images/symbol-o.svg';

class Square extends React.PureComponent {
  handleSquareClick(uttt, index) {
    if (uttt.legalIndexesHas(index)) {
      const { updateGameline } = this.props;
      const newUttt = uttt.clone();
      const newAction = new Action(uttt.nextSymbol, index);
      newUttt.execute(newAction);
      updateGameline(newUttt, newAction);
    }
  }

  handleSquareKeyDown(event, uttt, index) {
    const key = event.key;
    if (key === ' ' || key === 'Enter') {
      if (uttt.legalIndexesHas(index)) {
        const { updateGameline } = this.props;
        const newUttt = uttt.clone();
        const newAction = new Action(uttt.nextSymbol, index);
        newUttt.execute(newAction);
        updateGameline(newUttt, newAction);
      }
    }
  }

  render() {
    const { index, uttt, settings, isEvaluationVisible } = this.props;
    if (!uttt.state[index]) {
      if (uttt.legalIndexesHas(index)) {
        const { evaluatedAction } = this.props;
        const probabilityString =
          evaluatedAction && isEvaluationVisible ? formatProbability(evaluatedAction.probability) : '';
        let handleSquareClick;
        let handleSquareKeyDown;
        let clickableClassName;
        let tabIndexValue;
        if (
          (uttt.isNextSymbolX() && settings['controlPlayerX'] === 'HUMAN_CONTROL') ||
          (uttt.isNextSymbolO() && settings['controlPlayerO'] === 'HUMAN_CONTROL')
        ) {
          handleSquareClick = () => this.handleSquareClick(uttt, index);
          handleSquareKeyDown = (event) => this.handleSquareKeyDown(event, uttt, index);
          clickableClassName = 'clickable';
          tabIndexValue = '0';
        }
        const autoselectedClassName = evaluatedAction && evaluatedAction.autoselected ? 'autoselected' : null;
        const topClassName = evaluatedAction && evaluatedAction.top ? 'top' : null;
        return (
          <div
            className={joinClassNames(
              'square',
              'legal',
              clickableClassName,
              autoselectedClassName,
              uttt.nextSymbolString
            )}
            onClick={handleSquareClick}
            onKeyDown={handleSquareKeyDown}
            tabIndex={tabIndexValue}
          >
            <span className={joinClassNames('probability', topClassName)}>{probabilityString}</span>
          </div>
        );
      } else {
        return <div className="square"></div>;
      }
    }
    const { prevAction } = this.props;
    const prevClassName = prevAction && prevAction.index === index ? `prev ${prevAction.symbolString}` : null;
    if (uttt.state[index] === X_STATE_VALUE) {
      return (
        <div className={joinClassNames('square', prevClassName)}>
          <SymbolXIcon className="symbol-icon x" />
        </div>
      );
    } else if (uttt.state[index] === O_STATE_VALUE) {
      return (
        <div className={joinClassNames('square', prevClassName)}>
          <SymbolOIcon className="symbol-icon o" />
        </div>
      );
    }
  }
}

export default Square;
