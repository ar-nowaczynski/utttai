import React from 'react';
import Helmet from 'react-helmet';
import Supergame from '../game/Supergame';
import { FinalResult } from '../game/status';
import {
  UTTT_XWINS,
  UTTT_OWINS,
  UTTT_DRAW,
  UTTT_CONSTRAINED_V1,
  UTTT_CONSTRAINED_V2,
  UTTT_CONSTRAINED_V3,
  UTTT_UNCONSTRAINED_V1,
  UTTT_UNCONSTRAINED_V2,
  UTTT_UNCONSTRAINED_V3,
  EVALUATED_ACTIONS_GROUPED,
  SETTINGS,
} from './examples';

class Rules extends React.Component {
  renderGameBoard(uttt, prevAction) {
    return (
      <div className="game">
        <FinalResult uttt={uttt} />
        <div className="board">
          <Supergame
            uttt={uttt}
            prevAction={prevAction}
            evaluatedActionsGrouped={EVALUATED_ACTIONS_GROUPED}
            settings={SETTINGS}
            isEvaluationVisible={false}
            updateGameline={null}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="rules">
        <Helmet defer={false}>
          <title>uttt.ai – Rules</title>
        </Helmet>
        <h1>Rules</h1>
        <div className="content">
          <section className="rule-section">
            <div className="rule-description">
              Win a supergame (global board) by winning 3 subgames (local boards) in a straight line:
            </div>
            <div className="rule-examples">
              <div className="rule-example">{this.renderGameBoard(UTTT_XWINS, null)}</div>
              <div className="rule-example">{this.renderGameBoard(UTTT_OWINS, null)}</div>
              <div className="rule-example">{this.renderGameBoard(UTTT_DRAW, null)}</div>
            </div>
          </section>
          <section className="rule-section">
            <div className="rule-description">
              The X's most recent move determines a subgame (local board) for the O's next move and vice-versa:
            </div>
            <div className="rule-examples">
              <div className="rule-example">
                {this.renderGameBoard(UTTT_CONSTRAINED_V1, UTTT_CONSTRAINED_V1.prevAction)}
              </div>
              <div className="rule-example">
                {this.renderGameBoard(UTTT_CONSTRAINED_V2, UTTT_CONSTRAINED_V2.prevAction)}
              </div>
              <div className="rule-example">
                {this.renderGameBoard(UTTT_CONSTRAINED_V3, UTTT_CONSTRAINED_V3.prevAction)}
              </div>
            </div>
          </section>
          <section className="rule-section">
            <div className="rule-description">
              If a player is sent to a finished subgame, all unfinished subgames become available for the next move:
            </div>
            <div className="rule-examples">
              <div className="rule-example">
                {this.renderGameBoard(UTTT_UNCONSTRAINED_V1, UTTT_UNCONSTRAINED_V1.prevAction)}
              </div>
              <div className="rule-example">
                {this.renderGameBoard(UTTT_UNCONSTRAINED_V2, UTTT_UNCONSTRAINED_V2.prevAction)}
              </div>
              <div className="rule-example">
                {this.renderGameBoard(UTTT_UNCONSTRAINED_V3, UTTT_UNCONSTRAINED_V3.prevAction)}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }
}

export default Rules;
