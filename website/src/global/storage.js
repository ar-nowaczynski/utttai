function getFromLocalStorage(key, defaultValue = null) {
  if (!window.hasOwnProperty('localStorage')) {
    return defaultValue;
  }
  const value = localStorage.getItem(key);
  if (value === null) {
    return defaultValue;
  }
  return JSON.parse(value);
}

function getFromSessionStorage(key, defaultValue = null) {
  if (!window.hasOwnProperty('sessionStorage')) {
    return defaultValue;
  }
  const value = sessionStorage.getItem(key);
  if (value === null) {
    return defaultValue;
  }
  return JSON.parse(value);
}

function setToLocalStorage(key, value) {
  if (window.hasOwnProperty('localStorage')) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

function setToSessionStorage(key, value) {
  if (window.hasOwnProperty('sessionStorage')) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
}

export { getFromLocalStorage, getFromSessionStorage, setToLocalStorage, setToSessionStorage };
