import React from 'react';
import Helmet from 'react-helmet';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { joinClassNames } from './global/classnames';
import { shallowCopy, deepCopy } from './global/copying';
import { isMobileDevice } from './global/device';
import { getFromLocalStorage, setToLocalStorage } from './global/storage';
import Action from './game/Action';
import UltimateTicTacToe from './game/UltimateTicTacToe';
import Gameline from './game/Gameline';
import Dashboard from './game/Dashboard';
import Supergame from './game/Supergame';
import { GameMenu } from './game/menu';
import { LoadingModal } from './game/loading';
import { parseQueryState, parseQueryActions } from './game/parsing';
import NeuralMonteCarloTreeSearch from './selfplay/NeuralMonteCarloTreeSearch';
import { selectIndex } from './selfplay/helpers';
import { DesktopNavbar, MobileNavbar } from './navbar/Navbar';
import Settings from './settings/Settings';
import { increaseNumSimulations, decreaseNumSimulations } from './settings/helpers';
import InitCopyModal from './init/InitCopyModal';
import InitQueryError from './init/InitQueryError';
import Rules from './rules/Rules';
import Blog from './blog/Blog';
import About from './about/About';

class App extends React.Component {
  constructor() {
    super();
    const uttt = new UltimateTicTacToe();
    const settings = this.initializeSettings();
    const gameMenuSettings = this.initializeGameMenuSettings();
    this.nmcts = new NeuralMonteCarloTreeSearch(
      uttt.clone(),
      settings['numSimulations'],
      settings['explorationStrength'],
      this.updateCurrentNumSimulations,
      this.updateEvaluatedStateValueMean,
      this.updateEvaluatedActionsGrouped,
      this.autoSelectNextAction,
      this.isEvaluationDisabled
    );
    this.state = {
      // UTTT gameline:
      gameline: new Gameline(null, uttt, this.nmcts.tree.root),
      // AI evaluation:
      currentNumSimulations: null,
      evaluatedStateValueMean: null,
      evaluatedActionsGrouped: {},
      // settings:
      isSettingsModalOpened: false,
      settings: settings,
      isSettingsNumSimulationsOpened: false,
      settingsNumSimulationsTimerId: null,
      // game menu:
      isGameMenuOpened: true,
      gameMenuView: 'MAIN_MENU',
      gameMenuSettings: gameMenuSettings,
      // init:
      isInitCopyModalOpened: false,
      initQuery: null,
      initGameline: null,
      // mobile sidebar:
      isMenuSidebarOpened: false,
      // loading:
      loadingStatus: null,
      // route:
      routePath: null,
    };
  }

  componentDidUpdate(_prevProps, prevState) {
    if (this.state.settings !== prevState.settings) {
      setToLocalStorage('settings', this.state.settings);
    }
    if (this.state.gameMenuSettings !== prevState.gameMenuSettings) {
      setToLocalStorage('gameMenuSettings', this.state.gameMenuSettings);
    }
  }

  setAppColorTheme = (colorTheme) => {
    const app = document.querySelector('#app');
    app.dataset.theme = colorTheme.toLowerCase();
  };

  setRoutePath(newRoutePath) {
    if (this.state.routePath !== newRoutePath) {
      this.state.routePath = newRoutePath;
      setTimeout(() => {
        this.forceUpdate();
      }, 0);
    }
  }

  isResumable() {
    const { isGameMenuOpened, isSettingsModalOpened, isInitCopyModalOpened } = this.state;
    return (
      !isGameMenuOpened &&
      !isSettingsModalOpened &&
      !isInitCopyModalOpened &&
      (this.state.routePath === '/' || (this.state.routePath === '/init' && !this.state.initQuery.error))
    );
  }

  resumeSimulations = () => {
    if (this.isResumable()) {
      this.nmcts.synchronize(null, true, true);
    }
  };

  pauseSimulations = () => {
    this.nmcts.synchronize(null, false, false);
  };

  updateGameline = (uttt, action) => {
    if (this.isResumable()) {
      this.nmcts.synchronize(
        async () => {
          const { gameline } = this.state;
          const newGameline = gameline.clone();
          if (uttt.depthLevel !== gameline.uttt.depthLevel + 1) {
            return;
          }
          this.nmcts.tree.synchronize(uttt);
          newGameline.append(action, uttt, this.nmcts.tree.root);
          if (this.nmcts.tree.root.isUnevaluated()) {
            await this.nmcts.simulate();
          }
          this.setState({
            gameline: newGameline,
            currentNumSimulations: this.nmcts.tree.root.getCurrentNumSimulations(),
            evaluatedStateValueMean: this.nmcts.tree.root.getEvaluatedStateValueMean(),
            evaluatedActionsGrouped: this.nmcts.tree.root.getEvaluatedActionsGrouped(),
          });
        },
        true,
        true
      );
    }
  };

  resetGameline = (startSimulationsFlag, waitForSessionFlag, evaluateRootFlag) => {
    this.nmcts.synchronize(
      async () => {
        let newGameline;
        if (this.state.initQuery && !this.state.initQuery.error) {
          newGameline = this.state.initGameline.clone();
          this.nmcts.createTree(newGameline.uttt.clone());
        } else {
          const uttt = new UltimateTicTacToe();
          this.nmcts.createTree(uttt.clone());
          newGameline = new Gameline(null, uttt, this.nmcts.tree.root);
        }
        this.setState({
          gameline: newGameline,
          currentNumSimulations: null,
          evaluatedStateValueMean: null,
          evaluatedActionsGrouped: {},
        });
        if (evaluateRootFlag) {
          await this.nmcts.simulate();
          this.setState({
            currentNumSimulations: this.nmcts.tree.root.getCurrentNumSimulations(),
            evaluatedStateValueMean: this.nmcts.tree.root.getEvaluatedStateValueMean(),
            evaluatedActionsGrouped: this.nmcts.tree.root.getEvaluatedActionsGrouped(),
          });
        }
      },
      startSimulationsFlag,
      waitForSessionFlag
    );
  };

  undoGameline = () => {
    const { gameline } = this.state;
    if (!gameline.isOldest()) {
      this.nmcts.synchronize(
        async () => {
          const newGameline = gameline.clone();
          newGameline.undo();
          if (newGameline.root) {
            this.nmcts.tree.root = newGameline.root;
          } else {
            this.nmcts.createTree(newGameline.uttt.clone());
            newGameline.root = this.nmcts.tree.root;
          }
          if (this.nmcts.tree.root.isUnevaluated()) {
            await this.nmcts.simulate();
          }
          this.setState({
            gameline: newGameline,
            currentNumSimulations: this.nmcts.tree.root.getCurrentNumSimulations(),
            evaluatedStateValueMean: this.nmcts.tree.root.getEvaluatedStateValueMean(),
            evaluatedActionsGrouped: this.nmcts.tree.root.getEvaluatedActionsGrouped(),
          });
        },
        true,
        true
      );
    }
  };

  redoGameline = () => {
    const { gameline } = this.state;
    if (!gameline.isNewest()) {
      this.nmcts.synchronize(
        async () => {
          const newGameline = gameline.clone();
          newGameline.redo();
          this.nmcts.tree.root = newGameline.root;
          if (this.nmcts.tree.root.isUnevaluated()) {
            await this.nmcts.simulate();
          }
          this.setState({
            gameline: newGameline,
            currentNumSimulations: this.nmcts.tree.root.getCurrentNumSimulations(),
            evaluatedStateValueMean: this.nmcts.tree.root.getEvaluatedStateValueMean(),
            evaluatedActionsGrouped: this.nmcts.tree.root.getEvaluatedActionsGrouped(),
          });
        },
        true,
        true
      );
    }
  };

  autoSelectNextAction = () => {
    const { gameline, settings, evaluatedActionsGrouped } = this.state;
    const uttt = gameline.uttt;
    if (uttt.isTerminated()) {
      return;
    }
    if (Object.keys(evaluatedActionsGrouped).length === 0) {
      return;
    }
    let controlPlayer, autoSelection, autoSelectionDurationSeconds;
    if (uttt.isNextSymbolX()) {
      controlPlayer = settings['controlPlayerX'];
      autoSelection = settings['autoSelectionX'];
      autoSelectionDurationSeconds = settings['autoSelectionXDurationSeconds'];
    } else {
      controlPlayer = settings['controlPlayerO'];
      autoSelection = settings['autoSelectionO'];
      autoSelectionDurationSeconds = settings['autoSelectionODurationSeconds'];
    }
    if (controlPlayer === 'AI_CONTROL') {
      const index = selectIndex(evaluatedActionsGrouped, autoSelection);
      const newUttt = uttt.clone();
      const newAction = new Action(uttt.nextSymbol, index);
      newUttt.execute(newAction);
      if (autoSelectionDurationSeconds > 0) {
        const newEvaluatedActionsGrouped = deepCopy(evaluatedActionsGrouped);
        const subgame = Math.floor(index / 9);
        newEvaluatedActionsGrouped[subgame][index]['autoselected'] = true;
        this.setState({ evaluatedActionsGrouped: newEvaluatedActionsGrouped });
        this.nmcts.autoSelectionTimerId = setTimeout(() => {
          this.updateGameline(newUttt, newAction);
          this.nmcts.autoSelectionTimerId = null;
        }, autoSelectionDurationSeconds * 1000);
      } else {
        this.updateGameline(newUttt, newAction);
      }
    }
  };

  initializePolicyValueNetSession = () => {
    if (this.nmcts.policyValueNetSession) {
      return;
    }
    if (this.state.isGameMenuOpened) {
      return;
    }
    this.nmcts.createPolicyValueNetSession(
      () => {
        this.setState({ loadingStatus: { loading: true, isModalOpened: true } });
      },
      () => {
        this.setState({ loadingStatus: { success: true, isModalOpened: false } });
      },
      () => {
        this.setState({ loadingStatus: { error: true, isModalOpened: true } });
      }
    );
  };

  updateCurrentNumSimulations = () => {
    this.setState({ currentNumSimulations: this.nmcts.tree.root.getCurrentNumSimulations() });
  };

  updateEvaluatedStateValueMean = () => {
    this.setState({ evaluatedStateValueMean: this.nmcts.tree.root.getEvaluatedStateValueMean() });
  };

  updateEvaluatedActionsGrouped = () => {
    this.setState({ evaluatedActionsGrouped: this.nmcts.tree.root.getEvaluatedActionsGrouped() });
  };

  isEvaluationDisabled = (uttt) => {
    const { settings } = this.state;
    return (
      (uttt.isNextSymbolX() && settings['controlPlayerX'] === 'HUMAN_CONTROL' && settings['disableEvaluationsX']) ||
      (uttt.isNextSymbolO() && settings['controlPlayerO'] === 'HUMAN_CONTROL' && settings['disableEvaluationsO'])
    );
  };

  isEvaluationVisible = (uttt, settings) => {
    return (
      (uttt.isNextSymbolX() &&
        ((settings['controlPlayerX'] === 'HUMAN_CONTROL' && !settings['disableEvaluationsX']) ||
          (settings['controlPlayerX'] === 'AI_CONTROL' && !settings['hideEvaluationsX']))) ||
      (uttt.isNextSymbolO() &&
        ((settings['controlPlayerO'] === 'HUMAN_CONTROL' && !settings['disableEvaluationsO']) ||
          (settings['controlPlayerO'] === 'AI_CONTROL' && !settings['hideEvaluationsO'])))
    );
  };

  initializeSettings = () => {
    let settings = getFromLocalStorage('settings');
    if (settings === null) {
      settings = {
        'numSimulations': isMobileDevice() ? 100 : 1000,
        'explorationStrength': 2.0,
        'controlPlayerX': 'HUMAN_CONTROL',
        'controlPlayerO': 'HUMAN_CONTROL',
        'disableEvaluationsX': false,
        'disableEvaluationsO': false,
        'autoSelectionX': 'ARGMAX',
        'autoSelectionO': 'ARGMAX',
        'autoSelectionXDurationSeconds': 1,
        'autoSelectionODurationSeconds': 1,
        'hideEvaluationsX': false,
        'hideEvaluationsO': false,
        'colorTheme': 'LIGHT',
        'boardSize': 'DEFAULT',
      };
      setToLocalStorage('settings', settings);
    }
    this.setAppColorTheme(settings['colorTheme']);
    return settings;
  };

  updateSettings = (newSettings) => {
    const { settings } = this.state;
    const updatedSettings = shallowCopy(settings);
    for (const [key, value] of Object.entries(newSettings)) {
      updatedSettings[key] = value;
    }
    let setStateCallback = null;
    if ('colorTheme' in newSettings) {
      setStateCallback = () => {
        this.setAppColorTheme(newSettings['colorTheme']);
      };
    }
    this.setState({ settings: updatedSettings }, setStateCallback);
    if ('numSimulations' in newSettings) {
      this.nmcts.numSimulations = newSettings['numSimulations'];
    }
  };

  handleSettingsClick = () => {
    const { isSettingsModalOpened } = this.state;
    if (isSettingsModalOpened) {
      this.setState({ isSettingsModalOpened: false }, () => {
        const buttons = document.querySelectorAll('.settings-button');
        buttons.forEach((button) => button.classList.remove('opened'));
        this.resumeSimulations();
      });
    } else {
      this.pauseSimulations();
      this.setState({ isSettingsModalOpened: true }, () => {
        const buttons = document.querySelectorAll('.settings-button');
        buttons.forEach((button) => button.classList.add('opened'));
      });
    }
  };

  closeSettingsModal = () => {
    const { isSettingsModalOpened } = this.state;
    if (isSettingsModalOpened) {
      this.setState({ isSettingsModalOpened: false }, () => {
        const buttons = document.querySelectorAll('.settings-button');
        buttons.forEach((button) => button.classList.remove('opened'));
        this.resumeSimulations();
      });
    }
  };

  isCurrentNumSimulationsVisible = (uttt, settings) => {
    return (
      (uttt.isNextSymbolX() &&
        ((settings['controlPlayerX'] === 'HUMAN_CONTROL' && !settings['disableEvaluationsX']) ||
          settings['controlPlayerX'] === 'AI_CONTROL')) ||
      (uttt.isNextSymbolO() &&
        ((settings['controlPlayerO'] === 'HUMAN_CONTROL' && !settings['disableEvaluationsO']) ||
          settings['controlPlayerO'] === 'AI_CONTROL'))
    );
  };

  handleCurrentNumSimulationsClick = () => {
    let isFirstClick = true;
    if (this.state.settingsNumSimulationsTimerId !== null) {
      clearTimeout(this.state.settingsNumSimulationsTimerId);
      this.state.settingsNumSimulationsTimerId = null;
      isFirstClick = false;
    }
    if (!isFirstClick) {
      const { settings } = this.state;
      const numSimulations = settings['numSimulations'];
      const newNumSimulations = increaseNumSimulations(numSimulations);
      if (newNumSimulations !== numSimulations) {
        const newSettings = shallowCopy(settings);
        newSettings['numSimulations'] = newNumSimulations;
        this.setState({ settings: newSettings });
        this.nmcts.numSimulations = newNumSimulations;
        this.nmcts.synchronize(null, true, true);
      }
    }
    this.setState({ isSettingsNumSimulationsOpened: true }, () => {
      this.state.settingsNumSimulationsTimerId = setTimeout(() => {
        this.setState({ isSettingsNumSimulationsOpened: false });
        this.state.settingsNumSimulationsTimerId = null;
      }, 5000);
    });
  };

  handleSettingsNumSimulationsClick = () => {
    clearTimeout(this.state.settingsNumSimulationsTimerId);
    this.state.settingsNumSimulationsTimerId = null;
    const { settings } = this.state;
    const numSimulations = settings['numSimulations'];
    const newNumSimulations = decreaseNumSimulations(numSimulations);
    if (newNumSimulations !== numSimulations) {
      const newSettings = shallowCopy(settings);
      newSettings['numSimulations'] = newNumSimulations;
      this.setState({ settings: newSettings });
      this.nmcts.numSimulations = newNumSimulations;
      this.nmcts.synchronize(null, true, true);
    }
    this.setState({ isSettingsNumSimulationsOpened: true }, () => {
      this.state.settingsNumSimulationsTimerId = setTimeout(() => {
        this.setState({ isSettingsNumSimulationsOpened: false });
        this.state.settingsNumSimulationsTimerId = null;
      }, 5000);
    });
  };

  initializeGameMenuSettings = () => {
    let gameMenuSettings = getFromLocalStorage('gameMenuSettings');
    if (gameMenuSettings === null) {
      gameMenuSettings = {
        'playSubmenu': {
          'numSimulations': 1,
          'controlPlayerX': 'HUMAN_CONTROL',
          'controlPlayerO': 'AI_CONTROL',
          'autoSelection': 'ARGMAX',
          'autoSelectionDurationSeconds': 1,
        },
        'watchSubmenu': {
          'numSimulations': isMobileDevice() ? 100 : 1000,
          'autoSelection': 'ARGMAX',
          'autoSelectionDurationSeconds': 1,
        },
        'controlSubmenu': {
          'numSimulations': isMobileDevice() ? 100 : 1000,
        },
      };
      setToLocalStorage('gameMenuSettings', gameMenuSettings);
    }
    return gameMenuSettings;
  };

  updateGameMenuSettings = (submenuKey, submenuSettings) => {
    const { gameMenuSettings } = this.state;
    const updatedGameMenuSettings = deepCopy(gameMenuSettings);
    for (const [key, value] of Object.entries(submenuSettings)) {
      updatedGameMenuSettings[submenuKey][key] = value;
    }
    this.setState({ gameMenuSettings: updatedGameMenuSettings });
  };

  openGameMenu = () => {
    this.setState({ gameMenuView: 'MAIN_MENU', isGameMenuOpened: true });
  };

  updateGameMenuView = (newGameMenuView) => {
    this.setState({ gameMenuView: newGameMenuView });
  };

  closeGameMenu = (resumeSimulationsFlag) => {
    if (!this.state.loadingStatus) {
      this.setState({ isGameMenuOpened: false, loadingStatus: { loading: true, isModalOpened: true } }, () => {
        if (resumeSimulationsFlag) {
          this.resumeSimulations();
        }
      });
    } else {
      this.setState({ isGameMenuOpened: false }, () => {
        if (resumeSimulationsFlag) {
          this.resumeSimulations();
        }
      });
    }
  };

  handleMenuClick = () => {
    const { isMenuSidebarOpened } = this.state;
    this.setState({ isMenuSidebarOpened: !isMenuSidebarOpened });
    this.closeSettingsModal(true);
  };

  closeMenuSidebar = () => {
    this.setState({ isMenuSidebarOpened: false });
  };

  openInitCopyModal = () => {
    this.pauseSimulations();
    this.setState({ isInitCopyModalOpened: true });
  };

  closeInitCopyModal = () => {
    this.setState({ isInitCopyModalOpened: false }, this.resumeSimulations);
  };

  setInitQuery = (initQuery) => {
    this.state.initQuery = initQuery;
  };

  clearInitQuery = () => {
    this.state.initQuery = null;
  };

  initializeFromQueryState = (queryState) => {
    const parsedQueryStateObject = parseQueryState(queryState);
    if (parsedQueryStateObject.successFlag) {
      this.state.initGameline = parsedQueryStateObject.initQueryGameline;
      const newGameline = this.state.initGameline.clone();
      this.state.gameline = newGameline;
      this.nmcts.synchronize(
        async () => {
          this.nmcts.tree.synchronize(newGameline.uttt);
          newGameline.root = this.nmcts.tree.root;
          this.setState({ gameline: newGameline });
          if (this.nmcts.tree.root.isUnevaluated()) {
            await this.nmcts.simulate();
          }
          this.setState({
            currentNumSimulations: this.nmcts.tree.root.getCurrentNumSimulations(),
            evaluatedStateValueMean: this.nmcts.tree.root.getEvaluatedStateValueMean(),
            evaluatedActionsGrouped: this.nmcts.tree.root.getEvaluatedActionsGrouped(),
          });
        },
        true,
        false
      );
    } else {
      this.state.initQuery.error = parsedQueryStateObject.initQueryError;
    }
  };

  initializeFromQueryActions = (queryActions) => {
    const parsedQueryActionsObject = parseQueryActions(queryActions);
    if (parsedQueryActionsObject.successFlag) {
      this.state.initGameline = parsedQueryActionsObject.initQueryGameline;
      const newGameline = this.state.initGameline.clone();
      this.state.gameline = newGameline;
      this.nmcts.synchronize(
        async () => {
          this.nmcts.tree.synchronize(newGameline.uttt);
          newGameline.root = this.nmcts.tree.root;
          this.setState({ gameline: newGameline });
          if (this.nmcts.tree.root.isUnevaluated()) {
            await this.nmcts.simulate();
          }
          this.setState({
            currentNumSimulations: this.nmcts.tree.root.getCurrentNumSimulations(),
            evaluatedStateValueMean: this.nmcts.tree.root.getEvaluatedStateValueMean(),
            evaluatedActionsGrouped: this.nmcts.tree.root.getEvaluatedActionsGrouped(),
          });
        },
        true,
        false
      );
    } else {
      this.state.initQuery.error = parsedQueryActionsObject.initQueryError;
    }
  };

  renderHeader() {
    const { isMenuSidebarOpened } = this.state;
    const gamePath = this.state.initQuery && !this.state.initQuery.error ? this.state.initQuery.path : '/';
    const routePath = this.state.routePath;
    return (
      <header>
        <DesktopNavbar
          gamePath={gamePath}
          routePath={routePath}
          handleSettingsClick={this.handleSettingsClick}
          closeSettingsModal={this.closeSettingsModal}
          openInitCopyModal={this.openInitCopyModal}
          openGameMenu={this.openGameMenu}
          closeGameMenu={this.closeGameMenu}
          resetGameline={this.resetGameline}
        />
        <MobileNavbar
          gamePath={gamePath}
          routePath={routePath}
          isMenuSidebarOpened={isMenuSidebarOpened}
          handleMenuClick={this.handleMenuClick}
          closeMenuSidebar={this.closeMenuSidebar}
          handleSettingsClick={this.handleSettingsClick}
          openInitCopyModal={this.openInitCopyModal}
          openGameMenu={this.openGameMenu}
          closeGameMenu={this.closeGameMenu}
          resetGameline={this.resetGameline}
          resumeSimulations={this.resumeSimulations}
        />
      </header>
    );
  }

  renderSettings() {
    const { isSettingsModalOpened, settings } = this.state;
    if (!isSettingsModalOpened) {
      return;
    }
    return (
      <Settings settings={settings} updateSettings={this.updateSettings} closeSettingsModal={this.closeSettingsModal} />
    );
  }

  renderInitCopyModal() {
    const { isInitCopyModalOpened, gameline } = this.state;
    if (!isInitCopyModalOpened) {
      return;
    }
    return <InitCopyModal gameline={gameline} closeInitCopyModal={this.closeInitCopyModal} />;
  }

  renderInitQueryError = () => {
    return <InitQueryError initQueryError={this.state.initQuery.error} />;
  };

  renderGame = () => {
    this.initializePolicyValueNetSession();
    const {
      gameline,
      currentNumSimulations,
      evaluatedStateValueMean,
      evaluatedActionsGrouped,
      settings,
      isSettingsNumSimulationsOpened,
      isGameMenuOpened,
      gameMenuView,
      gameMenuSettings,
      loadingStatus,
    } = this.state;
    const isEvaluationVisible = this.isEvaluationVisible(gameline.uttt, settings);
    return (
      <div className={joinClassNames('game', settings['boardSize'] === 'ENLARGED' ? 'enlarged' : null)}>
        <Helmet defer={false}>
          <title>uttt.ai – AlphaZero-like AI for playing Ultimate Tic-Tac-Toe</title>
        </Helmet>
        <Dashboard
          uttt={gameline.uttt}
          currentNumSimulations={currentNumSimulations}
          evaluatedStateValueMean={evaluatedStateValueMean}
          settings={settings}
          isEvaluationVisible={isEvaluationVisible}
          isCurrentNumSimulationsVisible={this.isCurrentNumSimulationsVisible(gameline.uttt, settings)}
          isSettingsNumSimulationsOpened={isSettingsNumSimulationsOpened}
          handleCurrentNumSimulationsClick={this.handleCurrentNumSimulationsClick}
          handleSettingsNumSimulationsClick={this.handleSettingsNumSimulationsClick}
          isUndoable={!gameline.isOldest()}
          isRedoable={!gameline.isNewest()}
          undoGameline={this.undoGameline}
          redoGameline={this.redoGameline}
        />
        <div className="board">
          <Supergame
            uttt={gameline.uttt}
            prevAction={gameline.prevAction}
            evaluatedActionsGrouped={evaluatedActionsGrouped}
            settings={settings}
            isEvaluationVisible={isEvaluationVisible}
            updateGameline={this.updateGameline}
          />
          <GameMenu
            device="desktop"
            isGameMenuOpened={isGameMenuOpened}
            gameMenuView={gameMenuView}
            gameMenuSettings={gameMenuSettings}
            settings={settings}
            updateGameMenuView={this.updateGameMenuView}
            updateGameMenuSettings={this.updateGameMenuSettings}
            updateSettings={this.updateSettings}
            closeGameMenu={this.closeGameMenu}
          />
          <LoadingModal loadingStatus={loadingStatus} />
        </div>
        <GameMenu
          device="mobile"
          isGameMenuOpened={isGameMenuOpened}
          gameMenuView={gameMenuView}
          gameMenuSettings={gameMenuSettings}
          settings={settings}
          updateGameMenuView={this.updateGameMenuView}
          updateGameMenuSettings={this.updateGameMenuSettings}
          updateSettings={this.updateSettings}
          closeGameMenu={this.closeGameMenu}
        />
      </div>
    );
  };

  renderRoot = () => {
    if (this.state.routePath !== '/') {
      this.setRoutePath('/');
      this.resumeSimulations();
    }
    this.clearInitQuery();
    return this.renderGame();
  };

  renderInit = (props) => {
    const {
      location: { search: queryParams },
    } = props;
    if (!queryParams) {
      return <Redirect to="/" />;
    }
    if (this.state.initQuery === null) {
      this.setInitQuery({ params: queryParams, error: null, path: '/init' + queryParams, gameline: null });
      const searchParams = new URLSearchParams(queryParams);
      const params = Array.from(searchParams.keys());
      if (params.length !== 1) {
        return <Redirect to="/" />;
      }
      const queryState = searchParams.get('state');
      const queryActions = searchParams.get('actions');
      if (queryState) {
        this.initializeFromQueryState(queryState);
      } else if (queryActions) {
        this.initializeFromQueryActions(queryActions);
      } else {
        return <Redirect to="/" />;
      }
    }
    if (this.state.routePath !== '/init') {
      this.setRoutePath('/init');
      this.resumeSimulations();
    }
    if (this.state.initQuery.error) {
      this.pauseSimulations();
      return this.renderInitQueryError();
    } else {
      return this.renderGame();
    }
  };

  renderRules = () => {
    this.setRoutePath('/rules');
    this.pauseSimulations();
    return <Rules />;
  };

  renderBlog = () => {
    this.setRoutePath('/blog');
    this.pauseSimulations();
    return <Blog />;
  };

  renderAbout = () => {
    this.setRoutePath('/about');
    this.pauseSimulations();
    return <About />;
  };

  renderRouteRoot() {
    return <Route exact path="/" render={this.renderRoot} />;
  }

  renderRouteInit() {
    return <Route exact path="/init" render={this.renderInit} />;
  }

  renderRouteRules() {
    return <Route exact path="/rules" component={this.renderRules} />;
  }

  renderRouteBlog() {
    return <Route exact path="/blog" component={this.renderBlog} />;
  }

  renderRouteAbout() {
    return <Route exact path="/about" component={this.renderAbout} />;
  }

  render() {
    return (
      <BrowserRouter>
        {this.renderHeader()}
        {this.renderSettings()}
        <Switch>
          {this.renderRouteRoot()}
          {this.renderRouteInit()}
          {this.renderRouteRules()}
          {this.renderRouteBlog()}
          {this.renderRouteAbout()}
        </Switch>
        {this.renderInitCopyModal()}
      </BrowserRouter>
    );
  }
}

export default App;
