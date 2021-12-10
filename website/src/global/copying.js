function shallowCopy(object) {
  return Object.assign({}, object);
}

function deepCopy(object) {
  if (typeof object === 'object') {
    const newObject = {};
    for (const [key, value] of Object.entries(object)) {
      newObject[key] = deepCopy(value);
    }
    return newObject;
  } else if (typeof object === 'function') {
    throw new Error('deepCopy does not support function type');
  }
  // "boolean", "number", "string" or "undefined"
  return object;
}

export { shallowCopy, deepCopy };
