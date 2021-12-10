// prettier-ignore
const NUM_SIMULATIONS_RANGE = [
  1,
  10, 20, 30, 40, 50, 60, 70, 80, 90,
  100, 200, 300, 400, 500, 600, 700, 800, 900,
  1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000,
  10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000,
  100000,
];

function getNumSimulationsRangeLength() {
  return NUM_SIMULATIONS_RANGE.length;
}

function numSimulationsIndexOf(queryNumSimulations) {
  const index = NUM_SIMULATIONS_RANGE.indexOf(queryNumSimulations);
  if (index === -1) {
    for (let i = 0; i < NUM_SIMULATIONS_RANGE.length; i++) {
      if (NUM_SIMULATIONS_RANGE[i] > queryNumSimulations) {
        return i;
      }
    }
    return getNumSimulationsRangeLength() - 1;
  }
  return index;
}

function numSimulationsValueOf(queryNumSimulationsIndex) {
  if (queryNumSimulationsIndex < 0) {
    return NUM_SIMULATIONS_RANGE[0];
  } else if (queryNumSimulationsIndex >= NUM_SIMULATIONS_RANGE.length) {
    return NUM_SIMULATIONS_RANGE[NUM_SIMULATIONS_RANGE.length - 1];
  }
  return NUM_SIMULATIONS_RANGE[queryNumSimulationsIndex];
}

function increaseNumSimulations(queryNumSimulations) {
  for (let i = 0; i < NUM_SIMULATIONS_RANGE.length; i++) {
    if (NUM_SIMULATIONS_RANGE[i] > queryNumSimulations) {
      return NUM_SIMULATIONS_RANGE[i];
    }
  }
  return NUM_SIMULATIONS_RANGE[NUM_SIMULATIONS_RANGE.length - 1];
}

function decreaseNumSimulations(queryNumSimulations) {
  for (let i = NUM_SIMULATIONS_RANGE.length - 1; i >= 0; i--) {
    if (NUM_SIMULATIONS_RANGE[i] < queryNumSimulations) {
      return NUM_SIMULATIONS_RANGE[i];
    }
  }
  return NUM_SIMULATIONS_RANGE[0];
}

function isNumSimulationsMax(queryNumSimulations) {
  return queryNumSimulations >= NUM_SIMULATIONS_RANGE[NUM_SIMULATIONS_RANGE.length - 1];
}

function isNumSimulationsMin(queryNumSimulations) {
  return queryNumSimulations <= NUM_SIMULATIONS_RANGE[0];
}

export {
  getNumSimulationsRangeLength,
  numSimulationsIndexOf,
  numSimulationsValueOf,
  increaseNumSimulations,
  decreaseNumSimulations,
  isNumSimulationsMax,
  isNumSimulationsMin,
};
