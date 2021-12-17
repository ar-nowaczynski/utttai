import React from 'react';

class LoadingModal extends React.PureComponent {
  render() {
    const { loadingStatus, isGameMenuOpened } = this.props;
    if (!loadingStatus || !loadingStatus.isModalOpened || isGameMenuOpened) {
      return null;
    }
    if (loadingStatus.loading) {
      return (
        <div className="loading-modal">
          <div className="loading-modal-background">
            <div className="loading-modal-foreground">
              <span className="loading-modal-text">Loading AI...</span>
            </div>
          </div>
        </div>
      );
    } else if (loadingStatus.error) {
      return (
        <div className="loading-modal">
          <div className="loading-modal-background">
            <div className="loading-modal-foreground error">
              <span className="loading-modal-text error">Sorry, could not load AI.</span>
              <span className="loading-modal-text error">Your browser is not supported.</span>
              <span className="loading-modal-text error">(uttt.ai works best on Chrome, Firefox, Opera and Brave)</span>
            </div>
          </div>
        </div>
      );
    }
  }
}
export { LoadingModal };
