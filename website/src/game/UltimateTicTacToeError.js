export default class UltimateTicTacToeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UltimateTicTacToeError';
  }
}
