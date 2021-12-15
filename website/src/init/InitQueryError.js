import React from 'react';
import Helmet from 'react-helmet';

class InitQueryError extends React.PureComponent {
  render() {
    const { initQueryError } = this.props;
    return (
      <div className="init-query-error">
        <Helmet defer={false}>
          <title>uttt.ai – Init Query Error</title>
        </Helmet>
        <div className="init-query-error-title">Init Query Error</div>
        <div className="init-query-error-message">{initQueryError.message}</div>
        <div className="init-query-error-url">
          {initQueryError.urlPrefix}
          <span className="init-query-error-url-highlight">{initQueryError.urlHighlight}</span>
          {initQueryError.urlSuffix}
        </div>
      </div>
    );
  }
}

export default InitQueryError;
