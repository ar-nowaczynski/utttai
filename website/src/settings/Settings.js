import React from 'react';
import { joinClassNames } from '../global/classnames';
import { getNumSimulationsRangeLength, numSimulationsIndexOf, numSimulationsValueOf } from './helpers';
import TriangleLeftIcon from '../images/triangle-left.svg';
import TriangleRightIcon from '../images/triangle-right.svg';

class Settings extends React.PureComponent {
  handleNumSimulationsChange = (event) => {
    const { updateSettings } = this.props;
    const queryNumSimulationsIndex = Number(event.target.value);
    const newNumSimulations = numSimulationsValueOf(queryNumSimulationsIndex);
    updateSettings({
      numSimulations: newNumSimulations,
    });
  };

  handleControlPlayerXChange = (event) => {
    const { updateSettings } = this.props;
    const newControlPlayerX = event.target.value;
    updateSettings({
      controlPlayerX: newControlPlayerX,
    });
  };

  handleControlPlayerOChange = (event) => {
    const { updateSettings } = this.props;
    const newControlPlayerO = event.target.value;
    updateSettings({
      controlPlayerO: newControlPlayerO,
    });
  };

  handleDisableEvaluationsXChange = () => {
    const { settings, updateSettings } = this.props;
    const newDisableEvaluationsX = !settings['disableEvaluationsX'];
    updateSettings({
      disableEvaluationsX: newDisableEvaluationsX,
    });
  };

  handleDisableEvaluationsOChange = () => {
    const { settings, updateSettings } = this.props;
    const newDisableEvaluationsO = !settings['disableEvaluationsO'];
    updateSettings({
      disableEvaluationsO: newDisableEvaluationsO,
    });
  };

  handleAutoSelectionXChange = (event) => {
    const { updateSettings } = this.props;
    const newAutoSelectionX = event.target.value;
    updateSettings({
      autoSelectionX: newAutoSelectionX,
    });
  };

  handleAutoSelectionOChange = (event) => {
    const { updateSettings } = this.props;
    const newAutoSelectionO = event.target.value;
    updateSettings({
      autoSelectionO: newAutoSelectionO,
    });
  };

  handleAutoSelectionXDurationDecrementClick = () => {
    const { settings, updateSettings } = this.props;
    const newAutoSelectionXDurationSeconds = settings['autoSelectionXDurationSeconds'] - 1;
    if (newAutoSelectionXDurationSeconds >= 0) {
      updateSettings({
        autoSelectionXDurationSeconds: newAutoSelectionXDurationSeconds,
      });
    }
  };

  handleAutoSelectionXDurationIncrementClick = () => {
    const { settings, updateSettings } = this.props;
    const newAutoSelectionXDurationSeconds = settings['autoSelectionXDurationSeconds'] + 1;
    if (newAutoSelectionXDurationSeconds <= 9) {
      updateSettings({
        autoSelectionXDurationSeconds: newAutoSelectionXDurationSeconds,
      });
    }
  };

  handleAutoSelectionODurationDecrementClick = () => {
    const { settings, updateSettings } = this.props;
    const newAutoSelectionODurationSeconds = settings['autoSelectionODurationSeconds'] - 1;
    if (newAutoSelectionODurationSeconds >= 0) {
      updateSettings({
        autoSelectionODurationSeconds: newAutoSelectionODurationSeconds,
      });
    }
  };

  handleAutoSelectionODurationIncrementClick = () => {
    const { settings, updateSettings } = this.props;
    const newAutoSelectionODurationSeconds = settings['autoSelectionODurationSeconds'] + 1;
    if (newAutoSelectionODurationSeconds <= 9) {
      updateSettings({
        autoSelectionODurationSeconds: newAutoSelectionODurationSeconds,
      });
    }
  };

  handleHideEvaluationsXChange = () => {
    const { settings, updateSettings } = this.props;
    const newHideEvaluationsX = !settings['hideEvaluationsX'];
    updateSettings({
      hideEvaluationsX: newHideEvaluationsX,
    });
  };

  handleHideEvaluationsOChange = () => {
    const { settings, updateSettings } = this.props;
    const newHideEvaluationsO = !settings['hideEvaluationsO'];
    updateSettings({
      hideEvaluationsO: newHideEvaluationsO,
    });
  };

  handleColorThemeChange = (event) => {
    const { updateSettings } = this.props;
    const newColorTheme = event.target.value;
    updateSettings({
      colorTheme: newColorTheme,
    });
  };

  handleBoardSizeChange = () => {
    const { settings, updateSettings } = this.props;
    const newBoardSize = settings['boardSize'] === 'DEFAULT' ? 'ENLARGED' : 'DEFAULT';
    updateSettings({
      boardSize: newBoardSize,
    });
  };

  renderAISettings() {
    const { settings } = this.props;
    return (
      <fieldset className="ai-settings">
        <legend>AI</legend>
        <div className="num-simulations-settings">
          <label htmlFor="numsimulationsrange">
            <span>Num simulations:</span>
            <span className="num-simulations-settings-value">{settings['numSimulations'].toLocaleString('en-US')}</span>
          </label>
          <input
            type="range"
            id="numsimulationsrange"
            name="numsimulationsrange"
            min="0"
            max={getNumSimulationsRangeLength() - 1}
            value={numSimulationsIndexOf(settings['numSimulations'])}
            onChange={this.handleNumSimulationsChange}
          ></input>
        </div>
        <div className="num-simulations-settings-protip">
          Clicking on num simulations allows you to change num simulations without opening Settings.
        </div>
      </fieldset>
    );
  }

  renderHumanControlRadioX(humanControlChecked) {
    return (
      <div className="human-control-radio">
        <input
          type="radio"
          id="humancontrolx"
          name="humancontrolx"
          value="HUMAN_CONTROL"
          onChange={this.handleControlPlayerXChange}
          checked={humanControlChecked}
        />
        <label htmlFor="humancontrolx">
          <span>Human control</span>
        </label>
      </div>
    );
  }

  renderHumanControlRadioO(humanControlChecked) {
    return (
      <div className="human-control-radio">
        <input
          type="radio"
          id="humancontrolo"
          name="humancontrolo"
          value="HUMAN_CONTROL"
          onChange={this.handleControlPlayerOChange}
          checked={humanControlChecked}
        />
        <label htmlFor="humancontrolo">
          <span>Human control</span>
        </label>
      </div>
    );
  }

  renderDisableEvaluationsCheckboxX(humanControlChecked) {
    const { settings } = this.props;
    return (
      <div className="disable-evaluations-checkbox">
        <input
          type="checkbox"
          id="disableevaluationsxcheckbox"
          name="disableevaluationsxcheckbox"
          onChange={this.handleDisableEvaluationsXChange}
          checked={settings['disableEvaluationsX']}
          disabled={!humanControlChecked}
        />
        <label htmlFor="disableevaluationsxcheckbox">
          <span>Disable evaluations</span>
        </label>
      </div>
    );
  }

  renderDisableEvaluationsCheckboxO(humanControlChecked) {
    const { settings } = this.props;
    return (
      <div className="disable-evaluations-checkbox">
        <input
          type="checkbox"
          id="disableevaluationsocheckbox"
          name="disableevaluationsocheckbox"
          onChange={this.handleDisableEvaluationsOChange}
          checked={settings['disableEvaluationsO']}
          disabled={!humanControlChecked}
        />
        <label htmlFor="disableevaluationsocheckbox">
          <span>Disable evaluations</span>
        </label>
      </div>
    );
  }

  renderAIControlRadioX(aiControlChecked) {
    return (
      <div className="ai-control-radio">
        <input
          type="radio"
          id="aicontrolx"
          name="aicontrolx"
          value="AI_CONTROL"
          onChange={this.handleControlPlayerXChange}
          checked={aiControlChecked}
        />
        <label htmlFor="aicontrolx">
          <span>AI control</span>
        </label>
      </div>
    );
  }

  renderAIControlRadioO(aiControlChecked) {
    return (
      <div className="ai-control-radio">
        <input
          type="radio"
          id="aicontrolo"
          name="aicontrolo"
          value="AI_CONTROL"
          onChange={this.handleControlPlayerOChange}
          checked={aiControlChecked}
        />
        <label htmlFor="aicontrolo">
          <span>AI control</span>
        </label>
      </div>
    );
  }

  renderAutoSelectionSettingsX(aiControlChecked) {
    const { settings } = this.props;
    return (
      <div className="auto-selection-settings">
        <span className="auto-selection-text">Move selection:</span>
        <div className="auto-selection-radios">
          <div className="auto-selection-radio">
            <input
              type="radio"
              id="autoselectionxtop"
              name="autoselectionxtop"
              value="ARGMAX"
              onChange={this.handleAutoSelectionXChange}
              checked={settings['autoSelectionX'] === 'ARGMAX'}
              disabled={!aiControlChecked}
            />
            <label htmlFor="autoselectionxtop">
              <span>Argmax</span>
            </label>
          </div>
          <div className="auto-selection-radio">
            <input
              type="radio"
              id="autoselectionxsample"
              name="autoselectionxsample"
              value="SAMPLE"
              onChange={this.handleAutoSelectionXChange}
              checked={settings['autoSelectionX'] === 'SAMPLE'}
              disabled={!aiControlChecked}
            />
            <label htmlFor="autoselectionxsample">
              <span>Sample</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  renderAutoSelectionSettingsO(aiControlChecked) {
    const { settings } = this.props;
    return (
      <div className="auto-selection-settings">
        <span className="auto-selection-text">Move selection:</span>
        <div className="auto-selection-radios">
          <div className="auto-selection-radio">
            <input
              type="radio"
              id="autoselectionotop"
              name="autoselectionotop"
              value="ARGMAX"
              onChange={this.handleAutoSelectionOChange}
              checked={settings['autoSelectionO'] === 'ARGMAX'}
              disabled={!aiControlChecked}
            />
            <label htmlFor="autoselectionotop">
              <span>Argmax</span>
            </label>
          </div>
          <div className="auto-selection-radio">
            <input
              type="radio"
              id="autoselectionosample"
              name="autoselectionosample"
              value="SAMPLE"
              onChange={this.handleAutoSelectionOChange}
              checked={settings['autoSelectionO'] === 'SAMPLE'}
              disabled={!aiControlChecked}
            />
            <label htmlFor="autoselectionosample">
              <span>Sample</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  renderAutoSelectionHighlightingX(aiControlChecked) {
    const { settings } = this.props;
    return (
      <div className="auto-selection-highlighting">
        <span className="auto-selection-text">Move highlighting:</span>
        <div className="auto-selection-duration-settings">
          <button
            className="auto-selection-duration-button"
            disabled={!aiControlChecked || settings['autoSelectionXDurationSeconds'] === 0}
            onClick={this.handleAutoSelectionXDurationDecrementClick}
          >
            <TriangleLeftIcon className="auto-selection-duration-button-icon" />
          </button>
          <input
            type="number"
            id="autoselectionxdurationseconds"
            name="autoselectionxdurationseconds"
            className="auto-selection-duration-number"
            value={settings['autoSelectionXDurationSeconds']}
            min="0"
            max="9"
            disabled={!aiControlChecked}
            readOnly={true}
          />
          <button
            className="auto-selection-duration-button"
            disabled={!aiControlChecked || settings['autoSelectionXDurationSeconds'] === 9}
            onClick={this.handleAutoSelectionXDurationIncrementClick}
          >
            <TriangleRightIcon className="auto-selection-duration-button-icon" />
          </button>
          <label htmlFor="autoselectionxdurationseconds">
            <span>seconds</span>
          </label>
        </div>
      </div>
    );
  }

  renderAutoSelectionHighlightingO(aiControlChecked) {
    const { settings } = this.props;
    return (
      <div className="auto-selection-highlighting">
        <span className="auto-selection-text">Move highlighting:</span>
        <div className="auto-selection-duration-settings">
          <button
            className="auto-selection-duration-button"
            disabled={!aiControlChecked || settings['autoSelectionODurationSeconds'] === 0}
            onClick={this.handleAutoSelectionODurationDecrementClick}
          >
            <TriangleLeftIcon className="auto-selection-duration-button-icon" />
          </button>
          <input
            type="number"
            id="autoselectionodurationseconds"
            name="autoselectionodurationseconds"
            className="auto-selection-duration-number"
            value={settings['autoSelectionODurationSeconds']}
            min="0"
            max="9"
            disabled={!aiControlChecked}
            readOnly={true}
          />
          <button
            className="auto-selection-duration-button"
            disabled={!aiControlChecked || settings['autoSelectionODurationSeconds'] === 9}
            onClick={this.handleAutoSelectionODurationIncrementClick}
          >
            <TriangleRightIcon className="auto-selection-duration-button-icon" />
          </button>
          <label htmlFor="autoselectionodurationseconds">
            <span>seconds</span>
          </label>
        </div>
      </div>
    );
  }

  renderHideEvaluationsCheckboxX(aiControlChecked) {
    const { settings } = this.props;
    return (
      <div className="hide-evaluations-checkbox">
        <input
          type="checkbox"
          id="hideevaluationsxcheckbox"
          name="hideevaluationsxcheckbox"
          onChange={this.handleHideEvaluationsXChange}
          checked={settings['hideEvaluationsX']}
          disabled={!aiControlChecked}
        />
        <label htmlFor="hideevaluationsxcheckbox">
          <span>Hide evaluations</span>
        </label>
      </div>
    );
  }

  renderHideEvaluationsCheckboxO(aiControlChecked) {
    const { settings } = this.props;
    return (
      <div className="hide-evaluations-checkbox">
        <input
          type="checkbox"
          id="hideevaluationsocheckbox"
          name="hideevaluationsocheckbox"
          onChange={this.handleHideEvaluationsOChange}
          checked={settings['hideEvaluationsO']}
          disabled={!aiControlChecked}
        />
        <label htmlFor="hideevaluationsocheckbox">
          <span>Hide evaluations</span>
        </label>
      </div>
    );
  }

  renderPlayerSettingsX() {
    const { settings } = this.props;
    const humanControlChecked = settings['controlPlayerX'] === 'HUMAN_CONTROL';
    const aiControlChecked = settings['controlPlayerX'] === 'AI_CONTROL';
    return (
      <fieldset className="player-settings">
        <legend className="player-legend x">player X</legend>
        {this.renderHumanControlRadioX(humanControlChecked)}
        <div className={joinClassNames('human-control-settings', !humanControlChecked ? 'disabled' : null)}>
          {this.renderDisableEvaluationsCheckboxX(humanControlChecked)}
        </div>
        {this.renderAIControlRadioX(aiControlChecked)}
        <div className={joinClassNames('ai-control-settings', !aiControlChecked ? 'disabled' : null)}>
          {this.renderAutoSelectionSettingsX(aiControlChecked)}
          {this.renderAutoSelectionHighlightingX(aiControlChecked)}
          {this.renderHideEvaluationsCheckboxX(aiControlChecked)}
        </div>
      </fieldset>
    );
  }

  renderPlayerSettingsO() {
    const { settings } = this.props;
    const humanControlChecked = settings['controlPlayerO'] === 'HUMAN_CONTROL';
    const aiControlChecked = settings['controlPlayerO'] === 'AI_CONTROL';
    return (
      <fieldset className="player-settings">
        <legend className="player-legend o">player O</legend>
        {this.renderHumanControlRadioO(humanControlChecked)}
        <div className={joinClassNames('human-control-settings', !humanControlChecked ? 'disabled' : null)}>
          {this.renderDisableEvaluationsCheckboxO(humanControlChecked)}
        </div>
        {this.renderAIControlRadioO(aiControlChecked)}
        <div className={joinClassNames('ai-control-settings', !aiControlChecked ? 'disabled' : null)}>
          {this.renderAutoSelectionSettingsO(aiControlChecked)}
          {this.renderAutoSelectionHighlightingO(aiControlChecked)}
          {this.renderHideEvaluationsCheckboxO(aiControlChecked)}
        </div>
      </fieldset>
    );
  }

  renderColorThemeSettings() {
    const { settings } = this.props;
    return (
      <fieldset className="color-theme-settings">
        <legend>Theme</legend>
        <div>
          <div>
            <input
              type="radio"
              id="lightcolorstyle"
              name="lightcolorstyle"
              value="LIGHT"
              onChange={this.handleColorThemeChange}
              checked={settings['colorTheme'] === 'LIGHT'}
            />
            <label htmlFor="lightcolorstyle">
              <span>Light</span>
            </label>
          </div>
          <div>
            <input
              type="radio"
              id="darkcolorstyle"
              name="darkcolorstyle"
              value="DARK"
              onChange={this.handleColorThemeChange}
              checked={settings['colorTheme'] === 'DARK'}
            />
            <label htmlFor="darkcolorstyle">
              <span>Dark</span>
            </label>
          </div>
        </div>
      </fieldset>
    );
  }

  renderBoardSizeSettings() {
    const { settings } = this.props;
    return (
      <fieldset className="board-size-settings">
        <legend>View</legend>
        <input
          type="checkbox"
          id="enlargedboardsize"
          name="enlargedboardsize"
          onChange={this.handleBoardSizeChange}
          checked={settings['boardSize'] === 'ENLARGED'}
        />
        <label htmlFor="enlargedboardsize">
          <span>Enlarged board</span>
        </label>
      </fieldset>
    );
  }

  render() {
    const { closeSettingsModal } = this.props;
    return (
      <div className="settings">
        <div className="settings-panel">
          <h2 className="settings-header">Settings</h2>
          <div className="settings-content">
            {this.renderAISettings()}
            <fieldset className="players-settings">
              <legend>Players</legend>
              {this.renderPlayerSettingsX()}
              {this.renderPlayerSettingsO()}
            </fieldset>
            {this.renderColorThemeSettings()}
            {this.renderBoardSizeSettings()}
          </div>
          <button className="close-settings-button" onClick={closeSettingsModal}>
            <span>Close</span>
          </button>
        </div>
      </div>
    );
  }
}

export default Settings;
