function setClassName(...args) {
  // general implementation handling multiple formats and deduplication
  let classNames = [];
  for (let arg of args) {
    if (typeof arg === 'string') {
      for (let str of arg.split(' ')) {
        str = str.trim();
        if (str) {
          classNames.push(str);
        }
      }
    } else if (Array.isArray(arg)) {
      for (let str of arg) {
        str = String(str).trim();
        if (str) {
          classNames.push(str);
        }
      }
    } else if (typeof arg === 'object' && arg !== null) {
      for (let [key, value] of Object.entries(arg)) {
        if (value) {
          classNames.push(String(key));
        }
      }
    }
  }
  classNames = [...new Set(classNames)];
  classNames = classNames.join(' ');
  return classNames;
}

function joinClassNames(...args) {
  // narrow implemention filtering out falsy values
  return args.filter(Boolean).join(' ');
}

export { setClassName, joinClassNames };
