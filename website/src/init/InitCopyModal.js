import React from 'react';

class InitCopyModal extends React.PureComponent {
  componentDidMount() {
    this.autoResizeLinks();
  }

  componentDidUpdate() {
    this.autoResizeLinks();
  }

  autoResizeLinks() {
    const textarea1 = document.querySelector('#init-link-state');
    textarea1.style.height = textarea1.scrollHeight + 'px';
    const textarea2 = document.querySelector('#init-link-actions');
    if (textarea2) {
      textarea2.style.height = textarea2.scrollHeight + 'px';
    }
  }

  isCopyButtonFeasible() {
    return navigator && navigator.clipboard && navigator.clipboard.writeText;
  }

  getInitStateURL() {
    const { gameline } = this.props;
    const uttt = gameline.uttt;
    const stateString = uttt.state.map((s) => String(s)).join('');
    return `https://uttt.ai/init?state=${stateString}`;
  }

  getInitActionsURL() {
    const { gameline } = this.props;
    if (!gameline.startsFromEmptyUttt()) {
      return null;
    }
    let actionsString = '';
    const currentUttt = gameline.uttt;
    for (const { action, uttt } of gameline.array) {
      if (action !== null) {
        actionsString += action.symbolString;
        actionsString += String(action.index);
      }
      if (uttt === currentUttt) {
        break;
      }
    }
    return `https://uttt.ai/init?actions=${actionsString}`;
  }

  copyInitStateURL(initStateURL) {
    navigator.clipboard.writeText(initStateURL).then(() => {
      const textarea = document.querySelector('#init-link-state');
      textarea.select();
    });
  }

  copyInitActionsURL(initActionsURL) {
    navigator.clipboard.writeText(initActionsURL).then(() => {
      const textarea = document.querySelector('#init-link-actions');
      textarea.select();
    });
  }

  renderInitStateLink() {
    const initStateURL = this.getInitStateURL();
    let copyButton;
    if (this.isCopyButtonFeasible()) {
      copyButton = (
        <button className="init-copy-button" onClick={() => this.copyInitStateURL(initStateURL)}>
          Copy
        </button>
      );
    }
    return (
      <div className="init-copy-state">
        <textarea id="init-link-state" className="init-copy-textarea" value={initStateURL} readOnly />
        {copyButton}
      </div>
    );
  }

  renderInitActionsLink() {
    const initActionsURL = this.getInitActionsURL();
    if (initActionsURL === null) {
      return;
    }
    let copyButton;
    if (this.isCopyButtonFeasible()) {
      copyButton = (
        <button className="init-copy-button" onClick={() => this.copyInitActionsURL(initActionsURL)}>
          Copy
        </button>
      );
    }
    return (
      <div className="init-copy-actions">
        <textarea id="init-link-actions" className="init-copy-textarea" value={initActionsURL} readOnly />
        {copyButton}
      </div>
    );
  }

  render() {
    const { closeInitCopyModal } = this.props;
    return (
      <div className="init-copy-modal">
        <div className="init-copy-modal-background" onClick={closeInitCopyModal}>
          <div
            className="init-copy-modal-foreground"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="init-copy-title">/init links</div>
            {this.renderInitStateLink()}
            {this.renderInitActionsLink()}
          </div>
        </div>
      </div>
    );
  }
}

export default InitCopyModal;
