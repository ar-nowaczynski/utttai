import {
  STATE_SIZE,
  NEXT_SYMBOL_STATE_INDEX,
  CONSTRAINT_STATE_INDEX,
  UTTT_RESULT_STATE_INDEX,
  X_STATE_VALUE,
  O_STATE_VALUE,
  DRAW_STATE_VALUE,
  UNCONSTRAINED_STATE_VALUE,
} from './constants';
import Action from './Action';
import UltimateTicTacToe from './UltimateTicTacToe';
import UltimateTicTacToeError from './UltimateTicTacToeError';
import Gameline from './Gameline';

console.assert(X_STATE_VALUE === 1);
console.assert(O_STATE_VALUE === 2);
console.assert(DRAW_STATE_VALUE === 3);
console.assert(UNCONSTRAINED_STATE_VALUE === 9);

const SUBGAMES_STATE_VALUES = new Set(['0', '1', '2']);
const SUPERGAME_STATE_VALUES = new Set(['0', '1', '2', '3']);
const NEXT_SYMBOL_STATE_VALUES = new Set(['1', '2']);
const CONSTRAINT_STATE_VALUES = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
const UTTT_RESULT_STATE_VALUES = new Set(['0', '1', '2', '3']);
const DIGITS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

const INIT_QUERY_STATE_URL = 'uttt.ai/init?state=';
const INIT_QUERY_ACTIONS_URL = 'uttt.ai/init?actions=';

function QueryErrorObject(message, urlPrefix, urlHighlight, urlSuffix) {
  return {
    successFlag: false,
    initQueryGameline: null,
    initQueryError: {
      message: message,
      urlPrefix: urlPrefix,
      urlHighlight: urlHighlight,
      urlSuffix: urlSuffix,
    },
  };
}

function QueryStateUnexpectedLengthErrorObject(queryState) {
  const errorMessage = `Init query state has an unexpected length=${queryState.length} (should be ${STATE_SIZE}).`;
  if (queryState.length < STATE_SIZE) {
    return QueryErrorObject(
      errorMessage,
      INIT_QUERY_STATE_URL + queryState,
      '\u00A0'.repeat(STATE_SIZE - queryState.length)
    );
  } else if (queryState.length > STATE_SIZE) {
    return QueryErrorObject(
      errorMessage,
      INIT_QUERY_STATE_URL + queryState.slice(0, STATE_SIZE),
      queryState.slice(STATE_SIZE)
    );
  }
}

function QueryStateUnexpectedValueErrorObject(queryState, position, expectedValues) {
  const queryStateValue = queryState[position];
  const errorMessage = `Init query state has an unexpected value '${queryStateValue}' (should be ${expectedValues}).`;
  return QueryErrorObject(
    errorMessage,
    INIT_QUERY_STATE_URL + queryState.slice(0, position),
    queryState[position],
    queryState.slice(position + 1)
  );
}

function QueryStateUltimateTicTacToeErrorObject(queryState, errorMessage) {
  return QueryErrorObject(errorMessage, INIT_QUERY_STATE_URL + queryState);
}

function parseQueryState(queryState) {
  if (queryState.length !== STATE_SIZE) {
    return QueryStateUnexpectedLengthErrorObject(queryState);
  }
  const state = new Uint8Array(STATE_SIZE);
  for (let i = 0; i < STATE_SIZE; i++) {
    const queryStateValue = queryState[i];
    if (i >= 0 && i <= 80 && !SUBGAMES_STATE_VALUES.has(queryStateValue)) {
      return QueryStateUnexpectedValueErrorObject(queryState, i, `'0', '1' or '2'`);
    } else if (i >= 81 && i <= 89 && !SUPERGAME_STATE_VALUES.has(queryStateValue)) {
      return QueryStateUnexpectedValueErrorObject(queryState, i, `'0', '1', '2' or '3'`);
    } else if (i === NEXT_SYMBOL_STATE_INDEX && !NEXT_SYMBOL_STATE_VALUES.has(queryStateValue)) {
      return QueryStateUnexpectedValueErrorObject(queryState, i, `'1' or '2'`);
    } else if (i === CONSTRAINT_STATE_INDEX && !CONSTRAINT_STATE_VALUES.has(queryStateValue)) {
      return QueryStateUnexpectedValueErrorObject(queryState, i, `'0', '1', '2', '3', '4', '5', '6', '7', '8' or '9'`);
    } else if (i === UTTT_RESULT_STATE_INDEX && !UTTT_RESULT_STATE_VALUES.has(queryStateValue)) {
      return QueryStateUnexpectedValueErrorObject(queryState, i, `'0', '1', '2' or '3'`);
    }
    state[i] = Number(queryStateValue);
  }
  const uttt = new UltimateTicTacToe(state);
  try {
    uttt.verifyState();
  } catch (error) {
    if (error instanceof UltimateTicTacToeError) {
      return QueryStateUltimateTicTacToeErrorObject(queryState, error.message);
    } else {
      throw error;
    }
  }
  const gameline = new Gameline(null, uttt, null);
  return {
    successFlag: true,
    initQueryGameline: gameline,
    initQueryError: null,
  };
}

function formatLegalIndexesAsExpectedValues(legalIndexes) {
  let expectedValues = '';
  if (legalIndexes.length === 1) {
    expectedValues += `'${legalIndexes}'`;
  } else if (legalIndexes.length > 1) {
    for (const legalIndex of legalIndexes.slice(0, legalIndexes.length - 2)) {
      expectedValues += `'${legalIndex}', `;
    }
    expectedValues += `'${legalIndexes[legalIndexes.length - 2]}' or '${legalIndexes[legalIndexes.length - 1]}'`;
  } else {
    expectedValues += 'NONE';
  }
  return expectedValues;
}

function QueryActionsUnexpectedSymbolErrorObject(queryActions, position, expectedValues) {
  const queryActionsSymbol = queryActions[position];
  const errorMessage = `Init query actions have an unexpected symbol '${queryActionsSymbol}' (should be ${expectedValues}).`;
  return QueryErrorObject(
    errorMessage,
    INIT_QUERY_ACTIONS_URL + queryActions.slice(0, position),
    queryActions[position],
    queryActions.slice(position + 1)
  );
}

function QueryActionsMissingIndexErrorObject(queryActions, legalIndexes) {
  const expectedValues = formatLegalIndexesAsExpectedValues(legalIndexes);
  const errorMessage = `Init query actions have a missing index (should be ${expectedValues}).`;
  return QueryErrorObject(errorMessage, INIT_QUERY_ACTIONS_URL + queryActions, '\u00A0');
}

function QueryActionsDigitValueErrorObject(queryActions, position, legalIndexes) {
  const queryActionsValue = queryActions[position];
  const expectedValues = formatLegalIndexesAsExpectedValues(legalIndexes);
  const errorMessage = `Init query actions have an unexpected value '${queryActionsValue}' (should be ${expectedValues}).`;
  return QueryErrorObject(
    errorMessage,
    INIT_QUERY_ACTIONS_URL + queryActions.slice(0, position),
    queryActions[position],
    queryActions.slice(position + 1)
  );
}

function QueryActionsIllegalIndexErrorObject(queryActions, positionStart, positionEnd, legalIndexes) {
  const queryActionsIndex = queryActions.slice(positionStart, positionEnd);
  const expectedValues = formatLegalIndexesAsExpectedValues(legalIndexes);
  const errorMessage = `Init query actions have an illegal index '${queryActionsIndex}' (should be ${expectedValues}).`;
  return QueryErrorObject(
    errorMessage,
    INIT_QUERY_ACTIONS_URL + queryActions.slice(0, positionStart),
    queryActions.slice(positionStart, positionEnd),
    queryActions.slice(positionEnd)
  );
}

function parseQueryActions(queryActions) {
  const gameline = new Gameline(null, new UltimateTicTacToe(), null);
  let i = 0;
  while (i < queryActions.length) {
    let parsedLength = 0;
    const symbolStr = queryActions[i];
    if (gameline.uttt.isNextSymbolX() && symbolStr !== 'X' && symbolStr !== 'x') {
      return QueryActionsUnexpectedSymbolErrorObject(queryActions, i, `'X' or 'x'`);
    }
    if (gameline.uttt.isNextSymbolO() && symbolStr !== 'O' && symbolStr !== 'o') {
      return QueryActionsUnexpectedSymbolErrorObject(queryActions, i, `'O' or 'o'`);
    }
    const symbol = symbolStr.toLowerCase() === 'x' ? X_STATE_VALUE : O_STATE_VALUE;
    parsedLength += 1;
    const legalIndexes = gameline.uttt.getLegalIndexes();
    if (i + 1 >= queryActions.length) {
      return QueryActionsMissingIndexErrorObject(queryActions, legalIndexes);
    }
    if (!DIGITS.has(queryActions[i + 1])) {
      return QueryActionsDigitValueErrorObject(queryActions, i + 1, legalIndexes);
    }
    let indexStr = queryActions[i + 1];
    parsedLength += 1;
    if (i + 2 < queryActions.length && DIGITS.has(queryActions[i + 2])) {
      indexStr += queryActions[i + 2];
      parsedLength += 1;
    }
    const index = Number(indexStr);
    if (!gameline.uttt.legalIndexesHas(index)) {
      return QueryActionsIllegalIndexErrorObject(queryActions, i + 1, i + 1 + indexStr.length, legalIndexes);
    }
    const action = new Action(symbol, index);
    const uttt = gameline.uttt.clone();
    uttt.execute(action);
    gameline.append(action, uttt, null);
    i += parsedLength;
  }
  return {
    successFlag: true,
    initQueryGameline: gameline,
    initQueryError: null,
  };
}

export { parseQueryState, parseQueryActions };
