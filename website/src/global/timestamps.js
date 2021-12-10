function createTimestampIdGenerator() {
  let prev = new Date().getTime();

  return function () {
    let timestamp = new Date().getTime();
    if (timestamp <= prev) {
      timestamp = prev + 1;
    }
    prev = timestamp;
    return timestamp;
  };
}

const getTimestampId = createTimestampIdGenerator();

export { getTimestampId };
