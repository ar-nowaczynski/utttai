function roundNumber(number, decimalPlaces = 0) {
  return Number(Math.round(parseFloat(number + 'e' + decimalPlaces)) + 'e-' + decimalPlaces);
}

function formatProbability(probability) {
  const probabilityString = roundNumber(100 * probability, 2)
    .toFixed(2)
    .slice(0, 5);
  if (probabilityString === '0.00') {
    return '0.0';
  }
  return probabilityString;
}

function formatValue(value) {
  let valueString = roundNumber(100 * value, 2).toFixed(2);
  if (valueString[0] !== '-') {
    valueString = '+' + valueString;
  }
  valueString = valueString.slice(0, 6);
  if (valueString.endsWith('100.0')) {
    return valueString.slice(0, 4);
  } else if (valueString === '+0.00' || valueString === '-0.00') {
    return '0.0';
  }
  return valueString;
}

export { roundNumber, formatProbability, formatValue };
