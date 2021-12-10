export default class Gameline {
  constructor(action, uttt, root) {
    this.array = [
      {
        action: action,
        uttt: uttt,
        root: root,
      },
    ];
    this.index = 0;
  }

  get uttt() {
    return this.array[this.index].uttt;
  }

  get prevAction() {
    return this.array[this.index].action;
  }

  get root() {
    return this.array[this.index].root;
  }

  set root(root) {
    this.array[this.index].root = root;
  }

  clone() {
    const newGameline = new Gameline();
    newGameline.array = this.array.slice();
    newGameline.index = this.index;
    return newGameline;
  }

  append(action, uttt, root) {
    if (!this.isNewest()) {
      this.array = this.array.slice(0, this.index + 1);
    }
    this.array.push({
      action: action,
      uttt: uttt,
      root: root,
    });
    this.index += 1;
  }

  undo() {
    if (this.index > 0) {
      this.index -= 1;
    }
  }

  redo() {
    if (this.index + 1 < this.array.length) {
      this.index += 1;
    }
  }

  isOldest() {
    return this.index === 0;
  }

  isNewest() {
    return this.index + 1 === this.array.length;
  }

  startsFromEmptyUttt() {
    return this.array[0].uttt.depthLevel === 0;
  }
}
