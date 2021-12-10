import { X_STATE_VALUE, O_STATE_VALUE } from './constants';

const STATE_ARRAY_LENGTH = 324;

const STATE_ARRAY_2X = new Float32Array(STATE_ARRAY_LENGTH);
STATE_ARRAY_2X.fill(1, 162, 243);

const STATE_ARRAY_2O = new Float32Array(STATE_ARRAY_LENGTH);
STATE_ARRAY_2O.fill(-1, 162, 243);

// prettier-ignore
// flattened index (0, 1, ... 80) from the state index (0, 1, ... 80):
const FLAT_INDEX_0 = Int32Array.from([
   0,  1,  2,  9, 10, 11, 18, 19, 20,
   3,  4,  5, 12, 13, 14, 21, 22, 23,
   6,  7,  8, 15, 16, 17, 24, 25, 26,
  27, 28, 29, 36, 37, 38, 45, 46, 47,
  30, 31, 32, 39, 40, 41, 48, 49, 50,
  33, 34, 35, 42, 43, 44, 51, 52, 53,
  54, 55, 56, 63, 64, 65, 72, 73, 74,
  57, 58, 59, 66, 67, 68, 75, 76, 77,
  60, 61, 62, 69, 70, 71, 78, 79, 80,
]);
const FLAT_INDEX_1 = FLAT_INDEX_0.map((value) => value + 81);
const FLAT_INDEX_3 = FLAT_INDEX_0.map((value) => value + 243);

function getStateArray324(uttt) {
  let stateArray, xi, oi;
  if (uttt.isNextSymbolX()) {
    stateArray = STATE_ARRAY_2X.slice();
    xi = FLAT_INDEX_0;
    oi = FLAT_INDEX_1;
  } else {
    stateArray = STATE_ARRAY_2O.slice();
    xi = FLAT_INDEX_1;
    oi = FLAT_INDEX_0;
  }
  for (let si = 0; si < 81; si++) {
    if (uttt.state[si] === X_STATE_VALUE) {
      stateArray[xi[si]] = 1;
    } else if (uttt.state[si] === O_STATE_VALUE) {
      stateArray[oi[si]] = 1;
    }
  }
  for (let li of uttt.getLegalIndexes()) {
    stateArray[FLAT_INDEX_3[li]] = 1;
  }
  return stateArray;
}

export { getStateArray324, FLAT_INDEX_0 };
