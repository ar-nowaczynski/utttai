import {
  STATE_SIZE,
  NEXT_SYMBOL_STATE_INDEX,
  CONSTRAINT_STATE_INDEX,
  UTTT_RESULT_STATE_INDEX,
  X_STATE_VALUE,
  O_STATE_VALUE,
  DRAW_STATE_VALUE,
  UNCONSTRAINED_STATE_VALUE,
} from './constants.js';
import Action from './Action.js';
import UltimateTicTacToeError from './UltimateTicTacToeError.js';

export default class UltimateTicTacToe {
  constructor(state) {
    if (state) {
      this.state = state;
    } else {
      this.state = new Uint8Array(STATE_SIZE);
      this.state[NEXT_SYMBOL_STATE_INDEX] = X_STATE_VALUE;
      this.state[CONSTRAINT_STATE_INDEX] = UNCONSTRAINED_STATE_VALUE;
    }
    this._legalIndexesSet = null;
  }

  clone() {
    return new UltimateTicTacToe(this.state.slice());
  }

  isEqualTo(uttt) {
    for (let i = 0; i < STATE_SIZE; i += 1) {
      if (this.state[i] !== uttt.state[i]) {
        return false;
      }
    }
    return true;
  }

  execute(action, verify = true) {
    if (verify) {
      if (this.isTerminated()) {
        throw new UltimateTicTacToeError('supergame is terminated');
      }
      this.verifyState();
      this.verifyAction(action);
    }
    this.state[action.index] = action.symbol;
    this.updateSupergameResult(action.symbol, action.index);
    this.toggleNextSymbol();
    this.setNextConstraint(action.index);
    if (verify) {
      this.verifyState();
    }
    this._legalIndexesSet = null;
  }

  getLegalActions() {
    return this.getLegalIndexes().map((legalIndex) => new Action(this.nextSymbol, legalIndex));
  }

  getLegalIndexes() {
    if (this.isTerminated()) {
      return [];
    }
    let indexes;
    if (this.isUnconstrained()) {
      indexes = [];
      for (let subgame = 0; subgame < 9; subgame += 1) {
        if (!this.state[81 + subgame]) {
          indexes = indexes.concat(this.getEmptyIndexes(subgame));
        }
      }
    } else {
      indexes = this.getEmptyIndexes(this.constraint);
    }
    return indexes;
  }

  legalIndexesHas(index) {
    if (!this._legalIndexesSet) {
      this._legalIndexesSet = new Set(this.getLegalIndexes());
    }
    return this._legalIndexesSet.has(index);
  }

  get nextSymbol() {
    return this.state[NEXT_SYMBOL_STATE_INDEX];
  }

  get constraint() {
    return this.state[CONSTRAINT_STATE_INDEX];
  }

  get result() {
    return this.state[UTTT_RESULT_STATE_INDEX];
  }

  get depthLevel() {
    let depthLevel = 0;
    for (let index = 0; index < 81; index++) {
      depthLevel += this.state[index] !== 0;
    }
    return depthLevel;
  }

  isNextSymbolX() {
    return this.nextSymbol === X_STATE_VALUE;
  }

  isNextSymbolO() {
    return this.nextSymbol === O_STATE_VALUE;
  }

  get nextSymbolString() {
    if (this.isNextSymbolX()) {
      return 'x';
    } else if (this.isNextSymbolO()) {
      return 'o';
    }
  }

  isConstrained() {
    return this.constraint >= 0 && this.constraint < 9;
  }

  isUnconstrained() {
    return this.constraint === UNCONSTRAINED_STATE_VALUE;
  }

  isTerminated() {
    return Boolean(this.result);
  }

  isResultX() {
    return this.result === X_STATE_VALUE;
  }

  isResultO() {
    return this.result === O_STATE_VALUE;
  }

  isResultDraw() {
    return this.result === DRAW_STATE_VALUE;
  }

  isSubgameTerminated(subgame) {
    return Boolean(this.state[81 + subgame]);
  }

  isSubgameResultX(subgame) {
    return this.state[81 + subgame] === X_STATE_VALUE;
  }

  isSubgameResultO(subgame) {
    return this.state[81 + subgame] === O_STATE_VALUE;
  }

  isSubgameResultDraw(subgame) {
    return this.state[81 + subgame] === DRAW_STATE_VALUE;
  }

  getEmptyIndexes(subgame) {
    const indexes = [];
    const offset = subgame * 9;
    for (let index = offset; index < offset + 9; index += 1) {
      if (!this.state[index]) {
        indexes.push(index);
      }
    }
    return indexes;
  }

  isWinningPosition(symbol, subgame) {
    const state = this.state;
    const offset = subgame * 9;
    return (
      (symbol === state[offset + 4] &&
        ((symbol === state[offset + 0] && symbol === state[offset + 8]) ||
          (symbol === state[offset + 2] && symbol === state[offset + 6]) ||
          (symbol === state[offset + 1] && symbol === state[offset + 7]) ||
          (symbol === state[offset + 3] && symbol === state[offset + 5]))) ||
      (symbol === state[offset + 0] &&
        ((symbol === state[offset + 1] && symbol === state[offset + 2]) ||
          (symbol === state[offset + 3] && symbol === state[offset + 6]))) ||
      (symbol === state[offset + 8] &&
        ((symbol === state[offset + 2] && symbol === state[offset + 5]) ||
          (symbol === state[offset + 6] && symbol === state[offset + 7])))
    );
  }

  isFull(subgame) {
    const offset = subgame * 9;
    for (let index = offset; index < offset + 9; index += 1) {
      if (!this.state[index]) {
        return false;
      }
    }
    return true;
  }

  updateSupergameResult(symbol, index) {
    let subgameUpdated = false;
    const subgame = Math.trunc(index / 9);
    if (this.isWinningPosition(symbol, subgame)) {
      this.state[81 + subgame] = symbol;
      subgameUpdated = true;
    } else if (this.isFull(subgame)) {
      this.state[81 + subgame] = DRAW_STATE_VALUE;
      subgameUpdated = true;
    }
    if (subgameUpdated) {
      if (this.isWinningPosition(symbol, 9)) {
        this.state[UTTT_RESULT_STATE_INDEX] = symbol;
      } else if (this.isFull(9)) {
        this.state[UTTT_RESULT_STATE_INDEX] = DRAW_STATE_VALUE;
      }
    }
  }

  toggleNextSymbol() {
    if (this.isNextSymbolX()) {
      this.state[NEXT_SYMBOL_STATE_INDEX] = O_STATE_VALUE;
    } else if (this.isNextSymbolO()) {
      this.state[NEXT_SYMBOL_STATE_INDEX] = X_STATE_VALUE;
    }
  }

  setNextConstraint(index) {
    const nextSubgame = index % 9;
    if (this.state[81 + nextSubgame]) {
      this.state[CONSTRAINT_STATE_INDEX] = UNCONSTRAINED_STATE_VALUE;
    } else {
      this.state[CONSTRAINT_STATE_INDEX] = nextSubgame;
    }
  }

  verifyState() {
    this.verifySupergame();
    this.verifySubgames();
    this.verifyConstraint();
  }

  verifySupergame() {
    const x_w = this.isWinningPosition(X_STATE_VALUE, 9);
    const o_w = this.isWinningPosition(O_STATE_VALUE, 9);
    const full = this.isFull(9);
    if (x_w && o_w) {
      throw new UltimateTicTacToeError('X and O have winning positions on supergame');
    }
    if (x_w && !this.isResultX()) {
      throw new UltimateTicTacToeError('X won supergame, but result is not updated');
    }
    if (o_w && !this.isResultO()) {
      throw new UltimateTicTacToeError('O won supergame, but result is not updated');
    }
    if (full && !this.isResultDraw() && !(x_w || o_w)) {
      throw new UltimateTicTacToeError('DRAW on supergame, but result is not updated');
    }
  }

  verifySubgames() {
    for (let subgame = 0; subgame < 9; subgame += 1) {
      const x_w = this.isWinningPosition(X_STATE_VALUE, subgame);
      const o_w = this.isWinningPosition(O_STATE_VALUE, subgame);
      const full = this.isFull(subgame);
      if (x_w && o_w) {
        throw new UltimateTicTacToeError(`X and O have winning positions on subgame=${subgame}`);
      }
      if (x_w && this.state[81 + subgame] !== X_STATE_VALUE) {
        throw new UltimateTicTacToeError(`X won subgame=${subgame}, but supergame is not updated`);
      }
      if (o_w && this.state[81 + subgame] !== O_STATE_VALUE) {
        throw new UltimateTicTacToeError(`O won subgame=${subgame}, but supergame is not updated`);
      }
      if (full && this.state[81 + subgame] !== DRAW_STATE_VALUE && !(x_w || o_w)) {
        throw new UltimateTicTacToeError(`DRAW on subgame=${subgame}, but supergame is not updated`);
      }
    }
  }

  verifyConstraint() {
    if (!(this.isConstrained() || this.isUnconstrained())) {
      throw new UltimateTicTacToeError(`invalid constraint=${this.constraint}`);
    }
    if (this.isConstrained() && this.state[81 + this.constraint]) {
      throw new UltimateTicTacToeError(`constraint=${this.constraint} points to terminated subgame`);
    }
  }

  verifyAction(action) {
    const illegalAction = `Illegal ${action} - `;
    if (this.isNextSymbolX() && !action.isSymbolX()) {
      throw new UltimateTicTacToeError(illegalAction + 'next move belongs to X');
    }
    if (this.isNextSymbolO() && !action.isSymbolO()) {
      throw new UltimateTicTacToeError(illegalAction + 'next move belongs to O');
    }
    if (!(action.index >= 0 && action.index < 81)) {
      throw new UltimateTicTacToeError(illegalAction + 'index outside the valid range');
    }
    if (this.isConstrained() && this.constraint !== Math.trunc(action.index / 9)) {
      throw new UltimateTicTacToeError(illegalAction + `violated constraint=${this.constraint}`);
    }
    if (this.state[81 + Math.trunc(action.index / 9)]) {
      throw new UltimateTicTacToeError(illegalAction + 'index from terminated subgame');
    }
    if (this.state[action.index]) {
      throw new UltimateTicTacToeError(illegalAction + 'index is already taken');
    }
  }

  toString() {
    function stateValueToString(s) {
      if (s === X_STATE_VALUE) {
        return 'X';
      }
      if (s === O_STATE_VALUE) {
        return 'O';
      }
      if (s === DRAW_STATE_VALUE) {
        return '=';
      }
      if (s === 0) {
        return '-';
      }
      return '?';
    }
    function mapStateValuesToStringValues(state) {
      const values = [];
      for (let i = 0; i < state.length; i += 1) {
        values.push(stateValueToString(state[i]));
      }
      return values;
    }
    let subgames = mapStateValuesToStringValues(this.state.slice(0, 81));
    let supergame = mapStateValuesToStringValues(this.state.slice(81, 90));
    if (!this.isTerminated()) {
      const legalIndexes = this.getLegalIndexes();
      for (const legalIndex of legalIndexes) {
        subgames[legalIndex] = '•';
      }
      if (this.isConstrained()) {
        supergame[this.constraint] = '•';
      } else if (this.isUnconstrained()) {
        supergame = supergame.map((s) => (s === '-' ? '•' : s));
      }
    }
    const sb = (l, r) => subgames.slice(l, r + 1).join(' ');
    const sp = (l, r) => supergame.slice(l, r + 1).join(' ');
    subgames = [
      '    0 1 2   3 4 5   6 7 8',
      `  0 ${sb(0, 2)} │ ${sb(9, 11)} │ ${sb(18, 20)}`,
      `  1 ${sb(3, 5)} │ ${sb(12, 14)} │ ${sb(21, 23)}`,
      `  2 ${sb(6, 8)} │ ${sb(15, 17)} │ ${sb(24, 26)}`,
      `    ${'—'.repeat(21)}`,
      `  3 ${sb(27, 29)} │ ${sb(36, 38)} │ ${sb(45, 47)}`,
      `  4 ${sb(30, 32)} │ ${sb(39, 41)} │ ${sb(48, 50)}`,
      `  5 ${sb(33, 35)} │ ${sb(42, 44)} │ ${sb(51, 53)}`,
      `    ${'—'.repeat(21)}`,
      `  6 ${sb(54, 56)} │ ${sb(63, 65)} │ ${sb(72, 74)}`,
      `  7 ${sb(57, 59)} │ ${sb(66, 68)} │ ${sb(75, 77)}`,
      `  8 ${sb(60, 62)} │ ${sb(69, 71)} │ ${sb(78, 80)}`,
    ];
    supergame = ['  ' + sp(0, 2), '  ' + sp(3, 5), '  ' + sp(6, 8)];
    subgames = subgames.join('\n');
    supergame = supergame.join('\n');
    const nextSymbol = stateValueToString(this.nextSymbol);
    const constraint = this.isUnconstrained() ? 'None' : String(this.constraint);
    let result = 'None';
    if (this.isResultX()) {
      result = 'X_WON';
    } else if (this.isResultO()) {
      result = 'O_WON';
    } else if (this.isResultDraw()) {
      result = 'DRAW';
    }
    let output = 'UltimateTicTacToe(\n';
    output += `  subgames:\n${subgames}\n`;
    if (!this.isTerminated()) {
      output += `  next_symbol: ${nextSymbol}\n`;
      output += `  constraint: ${constraint}\n`;
    }
    output += `  supergame:\n${supergame}\n`;
    output += `  result: ${result}\n)`;
    return output;
  }
}
