export default class NeuralMonteCarloTreeSearchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NeuralMonteCarloTreeSearchError';
  }
}
