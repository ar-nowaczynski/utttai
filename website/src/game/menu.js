import React from 'react';
import { NavLink } from 'react-router-dom';
import { joinClassNames } from '../global/classnames';
import { getNumSimulationsRangeLength, numSimulationsIndexOf, numSimulationsValueOf } from '../settings/helpers';
import ThemeSwitchIcon from '../images/theme-switch.svg';
import UndoArrowIcon from '../images/undo-arrow.svg';
import HumanPlayerIcon from '../images/human-player.svg';
import AIPlayerIcon from '../images/ai-player.svg';
import TriangleLeftIcon from '../images/triangle-left.svg';
import TriangleRightIcon from '../images/triangle-right.svg';

class GameMenu extends React.PureComponent {
  handleThemeSwitchClick = () => {
    const { settings, updateSettings } = this.props;
    const newColorTheme = settings['colorTheme'] === 'LIGHT' ? 'DARK' : 'LIGHT';
    updateSettings({
      colorTheme: newColorTheme,
    });
  };

  handlePlayClick = () => {
    const { updateGameMenuView } = this.props;
    updateGameMenuView('PLAY_SUBMENU');
  };

  handleWatchClick = () => {
    const { updateGameMenuView } = this.props;
    updateGameMenuView('WATCH_SUBMENU');
  };

  handleControlClick = () => {
    const { updateGameMenuView } = this.props;
    updateGameMenuView('CONTROL_SUBMENU');
  };

  handleBackClick = () => {
    const { updateGameMenuView } = this.props;
    updateGameMenuView('MAIN_MENU');
  };

  handlePlayStartClick = () => {
    const { gameMenuSettings, updateSettings, closeGameMenu } = this.props;
    const newSettings = {};
    newSettings['numSimulations'] = gameMenuSettings['playSubmenu']['numSimulations'];
    newSettings['controlPlayerX'] = gameMenuSettings['playSubmenu']['controlPlayerX'];
    if (newSettings['controlPlayerX'] === 'HUMAN_CONTROL') {
      newSettings['controlPlayerO'] = 'AI_CONTROL';
      newSettings['disableEvaluationsX'] = true;
      newSettings['autoSelectionO'] = gameMenuSettings['playSubmenu']['autoSelection'];
      newSettings['autoSelectionODurationSeconds'] = gameMenuSettings['playSubmenu']['autoSelectionDurationSeconds'];
      newSettings['hideEvaluationsO'] = true;
    } else {
      newSettings['controlPlayerX'] = 'AI_CONTROL';
      newSettings['controlPlayerO'] = 'HUMAN_CONTROL';
      newSettings['disableEvaluationsO'] = true;
      newSettings['autoSelectionX'] = gameMenuSettings['playSubmenu']['autoSelection'];
      newSettings['autoSelectionXDurationSeconds'] = gameMenuSettings['playSubmenu']['autoSelectionDurationSeconds'];
      newSettings['hideEvaluationsX'] = true;
    }
    updateSettings(newSettings);
    closeGameMenu(true);
  };

  handleWatchStartClick = () => {
    const { gameMenuSettings, updateSettings, closeGameMenu } = this.props;
    updateSettings({
      numSimulations: gameMenuSettings['watchSubmenu']['numSimulations'],
      controlPlayerX: 'AI_CONTROL',
      controlPlayerO: 'AI_CONTROL',
      autoSelectionX: gameMenuSettings['watchSubmenu']['autoSelection'],
      autoSelectionO: gameMenuSettings['watchSubmenu']['autoSelection'],
      autoSelectionXDurationSeconds: gameMenuSettings['watchSubmenu']['autoSelectionDurationSeconds'],
      autoSelectionODurationSeconds: gameMenuSettings['watchSubmenu']['autoSelectionDurationSeconds'],
      hideEvaluationsX: false,
      hideEvaluationsO: false,
    });
    closeGameMenu(true);
  };

  handleControlStartClick = () => {
    const { gameMenuSettings, updateSettings, closeGameMenu } = this.props;
    updateSettings({
      numSimulations: gameMenuSettings['controlSubmenu']['numSimulations'],
      controlPlayerX: 'HUMAN_CONTROL',
      controlPlayerO: 'HUMAN_CONTROL',
      disableEvaluationsX: false,
      disableEvaluationsO: false,
    });
    closeGameMenu(true);
  };

  handlePlayControlClick = (newControlPlayerX, newControlPlayerO) => {
    const { updateGameMenuSettings } = this.props;
    updateGameMenuSettings('playSubmenu', {
      controlPlayerX: newControlPlayerX,
      controlPlayerO: newControlPlayerO,
    });
  };

  handleNumSimulationsChange = (event, submenuKey) => {
    const { updateGameMenuSettings } = this.props;
    const queryNumSimulationsIndex = Number(event.target.value);
    const newNumSimulations = numSimulationsValueOf(queryNumSimulationsIndex);
    updateGameMenuSettings(submenuKey, {
      numSimulations: newNumSimulations,
    });
  };

  handleAutoSelectionChange = (event, submenuKey) => {
    const { updateGameMenuSettings } = this.props;
    const newAutoSelection = event.target.value;
    updateGameMenuSettings(submenuKey, {
      autoSelection: newAutoSelection,
    });
  };

  handleAutoSelectionDurationDecrementClick = (submenuKey) => {
    const { gameMenuSettings, updateGameMenuSettings } = this.props;
    const newAutoSelectionDurationSeconds = gameMenuSettings[submenuKey]['autoSelectionDurationSeconds'] - 1;
    if (newAutoSelectionDurationSeconds >= 0) {
      updateGameMenuSettings(submenuKey, {
        autoSelectionDurationSeconds: newAutoSelectionDurationSeconds,
      });
    }
  };

  handleAutoSelectionDurationIncrementClick = (submenuKey) => {
    const { gameMenuSettings, updateGameMenuSettings } = this.props;
    const newAutoSelectionDurationSeconds = gameMenuSettings[submenuKey]['autoSelectionDurationSeconds'] + 1;
    if (newAutoSelectionDurationSeconds <= 9) {
      updateGameMenuSettings(submenuKey, {
        autoSelectionDurationSeconds: newAutoSelectionDurationSeconds,
      });
    }
  };

  renderThemeSwitch = () => {
    return <ThemeSwitchIcon className={'theme-switch-icon'} onClick={this.handleThemeSwitchClick} />;
  };

  renderBackButton = () => {
    return (
      <button className="back-button" onClick={this.handleBackClick} type="button" title="Back">
        <UndoArrowIcon className="back-button-icon" />
      </button>
    );
  };

  renderMainMenu() {
    const { device } = this.props;
    return (
      <div className={joinClassNames('gamemenu', device)}>
        <div className="gamemenu-background">
          <div className={joinClassNames('gamemenu-foreground', device)}>
            {this.renderThemeSwitch()}
            <span className="gamemenu-title">uttt.ai</span>
            <button className="gamemenu-button" onClick={this.handlePlayClick}>
              Play Human vs AI
            </button>
            <button className="gamemenu-button" onClick={this.handleWatchClick}>
              Watch AI self-play
            </button>
            <button className="gamemenu-button" onClick={this.handleControlClick}>
              Control both sides
            </button>
            <NavLink className="gamemenu-nav-link" exact to="/rules">
              Rules
            </NavLink>
            <NavLink className="gamemenu-nav-link" exact to="/blog">
              Blog
            </NavLink>
            <NavLink className="gamemenu-nav-link" exact to="/about">
              About
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  renderPlayControlSettings() {
    const { gameMenuSettings } = this.props;
    if (
      gameMenuSettings['playSubmenu']['controlPlayerX'] === 'HUMAN_CONTROL' ||
      gameMenuSettings['playSubmenu']['controlPlayerO'] === 'AI_CONTROL'
    ) {
      return (
        <div className="control-settings">
          <div
            className="control-settings-players"
            onClick={() => this.handlePlayControlClick('AI_CONTROL', 'HUMAN_CONTROL')}
          >
            <div className="control-settings-player x">
              <HumanPlayerIcon className="control-settings-player-icon x human" />
            </div>
            <span className="control-settings-player-symbol x">X</span>
            <span className="control-settings-vs">vs</span>
            <span className="control-settings-player-symbol o">O</span>
            <div className="control-settings-player o">
              <AIPlayerIcon className="control-settings-player-icon o ai" />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="control-settings">
          <div
            className="control-settings-players"
            onClick={() => this.handlePlayControlClick('HUMAN_CONTROL', 'AI_CONTROL')}
          >
            <div className="control-settings-player x">
              <AIPlayerIcon className="control-settings-player-icon x ai" />
            </div>
            <span className="control-settings-player-symbol x">X</span>
            <span className="control-settings-vs">vs</span>
            <span className="control-settings-player-symbol o">O</span>
            <div className="control-settings-player o">
              <HumanPlayerIcon className="control-settings-player-icon o human" />
            </div>
          </div>
        </div>
      );
    }
  }

  renderPlayNumSimulationsSettings() {
    const { device, gameMenuSettings } = this.props;
    return (
      <div className="num-simulations-settings">
        <label htmlFor={`${device}playnumsimulationsrange`}>
          <span>Num simulations:</span>
          <span className="num-simulations-settings-value">
            {gameMenuSettings['playSubmenu']['numSimulations'].toLocaleString('en-US')}
          </span>
        </label>
        <input
          type="range"
          id={`${device}playnumsimulationsrange`}
          name={`${device}playnumsimulationsrange`}
          min="0"
          max={getNumSimulationsRangeLength() - 1}
          value={numSimulationsIndexOf(gameMenuSettings['playSubmenu']['numSimulations'])}
          onChange={(event) => this.handleNumSimulationsChange(event, 'playSubmenu')}
        ></input>
      </div>
    );
  }

  renderPlayAutoSelectionSettings() {
    const { device, gameMenuSettings } = this.props;
    return (
      <div className="auto-selection-settings">
        <span className="auto-selection-text">Move selection:</span>
        <div className="auto-selection-radios">
          <div className="auto-selection-radio">
            <input
              type="radio"
              id={`${device}playautoselectiontop`}
              name={`${device}playautoselectiontop`}
              value="ARGMAX"
              onChange={(event) => this.handleAutoSelectionChange(event, 'playSubmenu')}
              checked={gameMenuSettings['playSubmenu']['autoSelection'] === 'ARGMAX'}
            />
            <label htmlFor={`${device}playautoselectiontop`}>
              <span>Argmax</span>
            </label>
          </div>
          <div className="auto-selection-radio">
            <input
              type="radio"
              id={`${device}playautoselectionsample`}
              name={`${device}playautoselectionsample`}
              value="SAMPLE"
              onChange={(event) => this.handleAutoSelectionChange(event, 'playSubmenu')}
              checked={gameMenuSettings['playSubmenu']['autoSelection'] === 'SAMPLE'}
            />
            <label htmlFor={`${device}playautoselectionsample`}>
              <span>Sample</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  renderPlayAutoSelectionHighlighting() {
    const { device, gameMenuSettings } = this.props;
    return (
      <div className="auto-selection-highlighting">
        <span className="auto-selection-text">Move highlighting:</span>
        <div className="auto-selection-duration-settings">
          <button
            className="auto-selection-duration-button"
            disabled={gameMenuSettings['playSubmenu']['autoSelectionDurationSeconds'] === 0}
            onClick={() => this.handleAutoSelectionDurationDecrementClick('playSubmenu')}
          >
            <TriangleLeftIcon className="auto-selection-duration-button-icon" />
          </button>
          <input
            type="number"
            id={`${device}playautoselectiondurationseconds`}
            name={`${device}playautoselectiondurationseconds`}
            className="auto-selection-duration-number"
            value={gameMenuSettings['playSubmenu']['autoSelectionDurationSeconds']}
            min="0"
            max="9"
            readOnly={true}
          />
          <button
            className="auto-selection-duration-button"
            disabled={gameMenuSettings['playSubmenu']['autoSelectionDurationSeconds'] === 9}
            onClick={() => this.handleAutoSelectionDurationIncrementClick('playSubmenu')}
          >
            <TriangleRightIcon className="auto-selection-duration-button-icon" />
          </button>
          <label htmlFor={`${device}playautoselectiondurationseconds`}>
            <span>seconds</span>
          </label>
        </div>
      </div>
    );
  }

  renderPlaySubmenu() {
    const { device } = this.props;
    return (
      <div className={joinClassNames('submenu', device)}>
        <div className="submenu-background">
          <div className={joinClassNames('submenu-foreground', device)}>
            {this.renderBackButton()}
            {this.renderThemeSwitch()}
            <span className="submenu-title">Play Human vs AI</span>
            <div className="submenu-content">
              <div className="submenu-settings">
                {this.renderPlayControlSettings()}
                {this.renderPlayNumSimulationsSettings()}
                {this.renderPlayAutoSelectionSettings()}
                {this.renderPlayAutoSelectionHighlighting()}
              </div>
              <div className="submenu-buttons">
                <button className="submenu-start-button" onClick={this.handlePlayStartClick}>
                  Start
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderWatchNumSimulationsSettings() {
    const { device, gameMenuSettings } = this.props;
    return (
      <div className="num-simulations-settings">
        <label htmlFor={`${device}watchnumsimulationsrange`}>
          <span>Num simulations:</span>
          <span className="num-simulations-settings-value">
            {gameMenuSettings['watchSubmenu']['numSimulations'].toLocaleString('en-US')}
          </span>
        </label>
        <input
          type="range"
          id={`${device}watchnumsimulationsrange`}
          name={`${device}watchnumsimulationsrange`}
          min="0"
          max={getNumSimulationsRangeLength() - 1}
          value={numSimulationsIndexOf(gameMenuSettings['watchSubmenu']['numSimulations'])}
          onChange={(event) => this.handleNumSimulationsChange(event, 'watchSubmenu')}
        ></input>
      </div>
    );
  }

  renderWatchAutoSelectionSettings() {
    const { device, gameMenuSettings } = this.props;
    return (
      <div className="auto-selection-settings">
        <span className="auto-selection-text">Move selection:</span>
        <div className="auto-selection-radios">
          <div className="auto-selection-radio">
            <input
              type="radio"
              id={`${device}watchautoselectiontop`}
              name={`${device}watchautoselectiontop`}
              value="ARGMAX"
              onChange={(event) => this.handleAutoSelectionChange(event, 'watchSubmenu')}
              checked={gameMenuSettings['watchSubmenu']['autoSelection'] === 'ARGMAX'}
            />
            <label htmlFor={`${device}watchautoselectiontop`}>
              <span>Argmax</span>
            </label>
          </div>
          <div className="auto-selection-radio">
            <input
              type="radio"
              id={`${device}watchautoselectionsample`}
              name={`${device}watchautoselectionsample`}
              value="SAMPLE"
              onChange={(event) => this.handleAutoSelectionChange(event, 'watchSubmenu')}
              checked={gameMenuSettings['watchSubmenu']['autoSelection'] === 'SAMPLE'}
            />
            <label htmlFor={`${device}watchautoselectionsample`}>
              <span>Sample</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  renderWatchAutoSelectionHighlighting() {
    const { device, gameMenuSettings } = this.props;
    return (
      <div className="auto-selection-highlighting">
        <span className="auto-selection-text">Move highlighting:</span>
        <div className="auto-selection-duration-settings">
          <button
            className="auto-selection-duration-button"
            disabled={gameMenuSettings['watchSubmenu']['autoSelectionDurationSeconds'] === 0}
            onClick={() => this.handleAutoSelectionDurationDecrementClick('watchSubmenu')}
          >
            <TriangleLeftIcon className="auto-selection-duration-button-icon" />
          </button>
          <input
            type="number"
            id={`${device}watchautoselectiondurationseconds`}
            name={`${device}watchautoselectiondurationseconds`}
            className="auto-selection-duration-number"
            value={gameMenuSettings['watchSubmenu']['autoSelectionDurationSeconds']}
            min="0"
            max="9"
            readOnly={true}
          />
          <button
            className="auto-selection-duration-button"
            disabled={gameMenuSettings['watchSubmenu']['autoSelectionDurationSeconds'] === 9}
            onClick={() => this.handleAutoSelectionDurationIncrementClick('watchSubmenu')}
          >
            <TriangleRightIcon className="auto-selection-duration-button-icon" />
          </button>
          <label htmlFor={`${device}watchautoselectiondurationseconds`}>
            <span>seconds</span>
          </label>
        </div>
      </div>
    );
  }

  renderWatchSubmenu() {
    const { device } = this.props;
    return (
      <div className={joinClassNames('submenu', device)}>
        <div className="submenu-background">
          <div className={joinClassNames('submenu-foreground', device)}>
            {this.renderBackButton()}
            {this.renderThemeSwitch()}
            <span className="submenu-title">Watch AI self-play</span>
            <div className="submenu-content">
              <div className="submenu-settings">
                {this.renderWatchNumSimulationsSettings()}
                {this.renderWatchAutoSelectionSettings()}
                {this.renderWatchAutoSelectionHighlighting()}
              </div>
              <div className="submenu-buttons">
                <button className="submenu-start-button" onClick={this.handleWatchStartClick}>
                  Start
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderControlNumSimulationsSettings() {
    const { device, gameMenuSettings } = this.props;
    return (
      <div className="num-simulations-settings">
        <label htmlFor={`${device}controlnumsimulationsrange`}>
          <span>Num simulations:</span>
          <span className="num-simulations-settings-value">
            {gameMenuSettings['controlSubmenu']['numSimulations'].toLocaleString('en-US')}
          </span>
        </label>
        <input
          type="range"
          id={`${device}controlnumsimulationsrange`}
          name={`${device}controlnumsimulationsrange`}
          min="0"
          max={getNumSimulationsRangeLength() - 1}
          value={numSimulationsIndexOf(gameMenuSettings['controlSubmenu']['numSimulations'])}
          onChange={(event) => this.handleNumSimulationsChange(event, 'controlSubmenu')}
        ></input>
      </div>
    );
  }

  renderControlSubmenu() {
    const { device } = this.props;
    return (
      <div className={joinClassNames('submenu', device)}>
        <div className="submenu-background">
          <div className={joinClassNames('submenu-foreground', device)}>
            {this.renderBackButton()}
            {this.renderThemeSwitch()}
            <span className="submenu-title">Control both sides</span>
            <div className="submenu-content">
              <div className="submenu-settings">{this.renderControlNumSimulationsSettings()}</div>
              <div className="submenu-buttons">
                <button className="submenu-start-button" onClick={this.handleControlStartClick}>
                  Start
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { gameMenuView, isGameMenuOpened } = this.props;
    if (!isGameMenuOpened) {
      return null;
    }
    if (gameMenuView === 'MAIN_MENU') {
      return this.renderMainMenu();
    } else if (gameMenuView === 'PLAY_SUBMENU') {
      return this.renderPlaySubmenu();
    } else if (gameMenuView === 'WATCH_SUBMENU') {
      return this.renderWatchSubmenu();
    } else if (gameMenuView === 'CONTROL_SUBMENU') {
      return this.renderControlSubmenu();
    }
  }
}

export { GameMenu };
