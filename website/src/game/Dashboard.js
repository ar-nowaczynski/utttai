import React from 'react';
import {
  UndoButton,
  RedoButton,
  NumMoves,
  PlayerIcon,
  PlayerSymbol,
  StateValue,
  FinalResult,
  NumSimulations,
  ProgressBar,
} from './status';

class Dashboard extends React.Component {
  render() {
    const {
      uttt,
      currentNumSimulations,
      evaluatedStateValueMean,
      settings,
      isEvaluationVisible,
      isCurrentNumSimulationsVisible,
      isSettingsNumSimulationsOpened,
      handleCurrentNumSimulationsClick,
      handleSettingsNumSimulationsClick,
      isUndoable,
      isRedoable,
      undoGameline,
      redoGameline,
    } = this.props;
    return (
      <div className="dashboard">
        <div className="status">
          <div className="status-left">
            <UndoButton isUndoable={isUndoable} undoGameline={undoGameline} />
            <NumMoves uttt={uttt} />
            <PlayerIcon
              uttt={uttt}
              settingsControlPlayerX={settings['controlPlayerX']}
              settingsControlPlayerO={settings['controlPlayerO']}
            />
            <PlayerSymbol uttt={uttt} />
          </div>
          <div className="status-middle">
            <StateValue uttt={uttt} evaluatedStateValueMean={isEvaluationVisible ? evaluatedStateValueMean : null} />
            <FinalResult uttt={uttt} />
          </div>
          <div className="status-right">
            <NumSimulations
              currentNumSimulations={isCurrentNumSimulationsVisible ? currentNumSimulations : null}
              settingsNumSimulations={settings['numSimulations']}
              isSettingsNumSimulationsOpened={isSettingsNumSimulationsOpened}
              handleCurrentNumSimulationsClick={handleCurrentNumSimulationsClick}
              handleSettingsNumSimulationsClick={handleSettingsNumSimulationsClick}
              uttt={uttt}
            />
            <RedoButton isRedoable={isRedoable} redoGameline={redoGameline} />
          </div>
        </div>
        <ProgressBar
          currentNumSimulations={isCurrentNumSimulationsVisible ? currentNumSimulations : null}
          settingsNumSimulations={settings['numSimulations']}
          uttt={uttt}
        />
      </div>
    );
  }
}

export default Dashboard;
