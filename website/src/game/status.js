import React from 'react';
import { joinClassNames } from '../global/classnames';
import { formatValue } from '../global/formatting';
import UndoArrowIcon from '../images/undo-arrow.svg';
import RedoArrowIcon from '../images/redo-arrow.svg';
import HumanPlayerIcon from '../images/human-player.svg';
import AIPlayerIcon from '../images/ai-player.svg';

class UndoButton extends React.PureComponent {
  render() {
    const { isUndoable, undoGameline } = this.props;
    return (
      <button
        className={joinClassNames('undo-button', isUndoable ? null : 'disabled')}
        onClick={undoGameline}
        type="button"
        title="Undo"
      >
        <UndoArrowIcon className="undo-button-icon" />
      </button>
    );
  }
}

class RedoButton extends React.PureComponent {
  render() {
    const { isRedoable, redoGameline } = this.props;
    return (
      <button
        className={joinClassNames('redo-button', isRedoable ? null : 'disabled')}
        onClick={redoGameline}
        type="button"
        title="Redo"
      >
        <RedoArrowIcon className="redo-button-icon" />
      </button>
    );
  }
}

class NumMoves extends React.PureComponent {
  render() {
    const { uttt } = this.props;
    return (
      <span className="num-moves" title="Num moves">
        {uttt.depthLevel}
      </span>
    );
  }
}

class PlayerIcon extends React.PureComponent {
  render() {
    const { uttt, settingsControlPlayerX, settingsControlPlayerO } = this.props;
    if (!uttt.isTerminated() && uttt.isNextSymbolX()) {
      if (settingsControlPlayerX === 'HUMAN_CONTROL') {
        return (
          <div className="player x" title="Next player">
            <HumanPlayerIcon className="player-icon x human" />
          </div>
        );
      } else if (settingsControlPlayerX === 'AI_CONTROL') {
        return (
          <div className="player x" title="Next player">
            <AIPlayerIcon className="player-icon x ai" />
          </div>
        );
      }
    } else if (!uttt.isTerminated() && uttt.isNextSymbolO()) {
      if (settingsControlPlayerO === 'HUMAN_CONTROL') {
        return (
          <div className="player o" title="Next player">
            <HumanPlayerIcon className="player-icon o human" />
          </div>
        );
      } else if (settingsControlPlayerO === 'AI_CONTROL') {
        return (
          <div className="player o" title="Next player">
            <AIPlayerIcon className="player-icon o ai" />
          </div>
        );
      }
    } else {
      return null;
    }
  }
}

class PlayerSymbol extends React.PureComponent {
  render() {
    const { uttt } = this.props;
    if (!uttt.isTerminated()) {
      if (uttt.isNextSymbolX()) {
        return (
          <span className="player-symbol x" title="Next symbol">
            X
          </span>
        );
      } else if (uttt.isNextSymbolO()) {
        return (
          <span className="player-symbol o" title="Next symbol">
            O
          </span>
        );
      }
    } else {
      return null;
    }
  }
}

class StateValue extends React.PureComponent {
  render() {
    const { uttt, evaluatedStateValueMean } = this.props;
    if (!uttt.isTerminated() && evaluatedStateValueMean !== null) {
      const nextSymbolString = uttt.nextSymbolString;
      const evaluatedStateValueMeanString = formatValue(evaluatedStateValueMean);
      return (
        <span className={`state-value ${nextSymbolString}`} title="State value">
          {evaluatedStateValueMeanString}
        </span>
      );
    } else {
      return null;
    }
  }
}

class FinalResult extends React.PureComponent {
  render() {
    const { uttt } = this.props;
    if (uttt.isTerminated()) {
      let utttResultString, utttResultClassName;
      if (uttt.isResultX()) {
        utttResultString = 'X wins!';
        utttResultClassName = 'uttt-result x';
      } else if (uttt.isResultO()) {
        utttResultString = 'O wins!';
        utttResultClassName = 'uttt-result o';
      } else if (uttt.isResultDraw()) {
        utttResultString = 'DRAW';
        utttResultClassName = 'uttt-result draw';
      }
      return (
        <div className="final-result" title="Final result">
          <span className={utttResultClassName}>{utttResultString}</span>
        </div>
      );
    } else {
      return null;
    }
  }
}

class NumSimulations extends React.PureComponent {
  renderNumSimulationsBox() {
    const {
      currentNumSimulations,
      settingsNumSimulations,
      isSettingsNumSimulationsOpened,
      handleSettingsNumSimulationsClick,
    } = this.props;
    if (isSettingsNumSimulationsOpened && currentNumSimulations !== null) {
      return (
        <span className="settings-num-simulations" onClick={handleSettingsNumSimulationsClick}>
          {settingsNumSimulations}
        </span>
      );
    } else {
      return null;
    }
  }

  render() {
    const { currentNumSimulations, handleCurrentNumSimulationsClick, uttt } = this.props;
    if (!uttt.isTerminated() && currentNumSimulations !== null) {
      return (
        <span className="num-simulations">
          <span
            className={`current-num-simulations ${uttt.nextSymbolString}`}
            onClick={handleCurrentNumSimulationsClick}
            title="Num simulations"
          >
            {currentNumSimulations}
          </span>
          {this.renderNumSimulationsBox()}
        </span>
      );
    } else {
      return null;
    }
  }
}

class ProgressBar extends React.PureComponent {
  render() {
    const { currentNumSimulations, settingsNumSimulations, uttt } = this.props;
    if (!uttt.isTerminated()) {
      if (currentNumSimulations !== null) {
        const progressRate = 100 * Math.min(1, currentNumSimulations / settingsNumSimulations);
        return <div className={`progress-bar ${uttt.nextSymbolString}`} style={{ 'width': `${progressRate}%` }}></div>;
      } else {
        return <div className={`progress-bar ${uttt.nextSymbolString}`} style={{ 'width': `100%` }}></div>;
      }
    } else {
      let resultSymbol;
      if (uttt.isResultX()) {
        resultSymbol = 'x';
      } else if (uttt.isResultO()) {
        resultSymbol = 'o';
      } else if (uttt.isResultDraw()) {
        resultSymbol = 'draw';
      }
      return <div className={`progress-bar ${resultSymbol}`} style={{ 'width': `100%` }}></div>;
    }
  }
}

export {
  UndoButton,
  RedoButton,
  NumMoves,
  PlayerIcon,
  PlayerSymbol,
  StateValue,
  FinalResult,
  NumSimulations,
  ProgressBar,
};
