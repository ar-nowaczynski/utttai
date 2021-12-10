import { X_STATE_VALUE, O_STATE_VALUE } from './constants';

export default class Action {
  constructor(symbol, index) {
    this.symbol = symbol;
    this.index = index;
  }

  isSymbolX() {
    return this.symbol === X_STATE_VALUE;
  }

  isSymbolO() {
    return this.symbol === O_STATE_VALUE;
  }

  get symbolString() {
    if (this.isSymbolX()) {
      return 'x';
    } else if (this.isSymbolO()) {
      return 'o';
    }
  }

  toString() {
    return `Action(symbol=${this.symbolString.toUpperCase()}, index=${this.index})`;
  }
}
