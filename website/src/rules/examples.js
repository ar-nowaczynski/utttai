import Action from '../game/Action';
import UltimateTicTacToe from '../game/UltimateTicTacToe';

export const UTTT_XWINS = new UltimateTicTacToe(
  new Uint8Array([
    2, 1, 0, 1, 0, 2, 2, 2, 1, 2, 0, 0, 2, 0, 2, 2, 0, 0, 0, 0, 0, 1, 1, 1, 2, 1, 0, 1, 2, 2, 2, 2, 1, 0, 2, 0, 0, 0, 0,
    1, 1, 1, 0, 0, 2, 1, 1, 2, 1, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 2, 2, 2, 0, 2, 0, 0, 0, 2, 2,
    0, 0, 1, 0, 2, 1, 2, 1, 2, 1, 0, 0, 2, 9, 1,
  ])
);

export const UTTT_OWINS = new UltimateTicTacToe(
  new Uint8Array([
    2, 2, 1, 1, 0, 1, 2, 0, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 2, 1, 1, 1, 2, 2, 1, 2, 2, 0, 0, 1, 2, 1, 0, 1, 0, 0, 1, 1, 2,
    2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 0, 2, 1, 0, 2, 0, 2, 2, 0, 0, 2, 0, 2, 0, 0, 1, 2, 1, 1, 1, 1, 0, 1, 2, 0, 2, 0,
    2, 1, 0, 1, 1, 2, 1, 3, 2, 2, 1, 2, 1, 9, 2,
  ])
);

export const UTTT_DRAW = new UltimateTicTacToe(
  new Uint8Array([
    1, 1, 1, 2, 0, 0, 0, 0, 1, 2, 2, 1, 0, 1, 1, 2, 2, 1, 2, 1, 1, 1, 2, 2, 1, 2, 1, 1, 2, 2, 2, 1, 1, 2, 1, 1, 2, 2, 2,
    2, 1, 2, 0, 1, 0, 2, 1, 1, 1, 2, 1, 1, 1, 2, 0, 0, 2, 1, 2, 2, 1, 2, 2, 2, 2, 2, 1, 0, 0, 1, 1, 2, 1, 2, 2, 2, 1, 2,
    0, 0, 1, 1, 1, 3, 1, 2, 2, 2, 2, 1, 1, 9, 3,
  ])
);

export const UTTT_CONSTRAINED_V1 = new UltimateTicTacToe();
for (const index of [37]) {
  const action = new Action(UTTT_CONSTRAINED_V1.nextSymbol, index);
  UTTT_CONSTRAINED_V1.execute(action);
  UTTT_CONSTRAINED_V1.prevAction = action;
}

export const UTTT_CONSTRAINED_V2 = new UltimateTicTacToe();
for (const index of [37, 14]) {
  const action = new Action(UTTT_CONSTRAINED_V2.nextSymbol, index);
  UTTT_CONSTRAINED_V2.execute(action);
  UTTT_CONSTRAINED_V2.prevAction = action;
}

export const UTTT_CONSTRAINED_V3 = new UltimateTicTacToe();
for (const index of [
  37, 14, 48, 34, 66, 35, 74, 25, 67, 39, 28, 11, 24, 62, 78, 60, 59, 46, 9, 7, 69, 56, 21, 33, 58, 38, 19, 12, 17, 73,
  13, 41, 53, 75, 36, 8, 77, 51, 55, 4, 42, 54, 5, 47, 26,
]) {
  const action = new Action(UTTT_CONSTRAINED_V3.nextSymbol, index);
  UTTT_CONSTRAINED_V3.execute(action);
  UTTT_CONSTRAINED_V3.prevAction = action;
}

export const UTTT_UNCONSTRAINED_V1 = new UltimateTicTacToe();
for (const index of [19, 12, 35, 73, 10, 9, 6, 58, 40, 36, 3, 32, 48, 30, 34, 65, 20, 18, 0, 50, 45]) {
  const action = new Action(UTTT_UNCONSTRAINED_V1.nextSymbol, index);
  UTTT_UNCONSTRAINED_V1.execute(action);
  UTTT_UNCONSTRAINED_V1.prevAction = action;
}

export const UTTT_UNCONSTRAINED_V2 = new UltimateTicTacToe();
for (const index of [
  40, 36, 6, 60, 61, 66, 32, 47, 20, 19, 14, 50, 53, 75, 30, 34, 70, 71, 74, 22, 37, 10, 11, 25, 64, 16, 68, 48, 27, 7,
  63, 1, 9, 3, 35, 72, 0, 2, 43, 67,
]) {
  const action = new Action(UTTT_UNCONSTRAINED_V2.nextSymbol, index);
  UTTT_UNCONSTRAINED_V2.execute(action);
  UTTT_UNCONSTRAINED_V2.prevAction = action;
}

export const UTTT_UNCONSTRAINED_V3 = new UltimateTicTacToe();
for (const index of [
  57, 28, 14, 52, 70, 68, 46, 16, 64, 12, 34, 67, 40, 36, 0, 2, 24, 62, 80, 76, 41, 47, 21, 27, 5, 50, 45, 7, 66, 31,
  38, 18, 4, 39, 29, 22, 44, 78, 54, 6, 58, 33, 60, 49, 65, 26, 77, 51, 11, 32, 35, 75, 30,
]) {
  const action = new Action(UTTT_UNCONSTRAINED_V3.nextSymbol, index);
  UTTT_UNCONSTRAINED_V3.execute(action);
  UTTT_UNCONSTRAINED_V3.prevAction = action;
}

export const EVALUATED_ACTIONS_GROUPED = {
  0: null,
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
  7: null,
  8: null,
};

export const SETTINGS = {
  'controlPlayerX': 'AI_CONTROL',
  'controlPlayerO': 'AI_CONTROL',
};
