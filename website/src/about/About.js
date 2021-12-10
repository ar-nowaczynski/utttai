import React from 'react';
import Helmet from 'react-helmet';
import { NavLink } from 'react-router-dom';

class About extends React.Component {
  render() {
    return (
      <div className="about">
        <Helmet defer={false}>
          <title>uttt.ai – About</title>
        </Helmet>
        <h1>About</h1>
        <div className="content">
          <div>
            Hello, I'm <strong>Arkadiusz Nowaczyński</strong>.
          </div>
          <div className="profile-links">
            <a className="profile-link" href="https://twitter.com/ArNowaczynski">
              twitter
            </a>
            <a className="profile-link" href="https://github.com/ar-nowaczynski">
              github
            </a>
            <a className="profile-link" href="https://www.linkedin.com/in/arkadiusz-nowaczynski/">
              linkedin
            </a>
          </div>
          <div>
            This website is my{' '}
            <strong>
              side-project inspired by{' '}
              <a href="https://deepmind.com/blog/article/alphazero-shedding-new-light-grand-games-chess-shogi-and-go">
                DeepMind's AlphaZero
              </a>
            </strong>
            .
          </div>
          <div>
            <a href="https://en.wikipedia.org/wiki/AlphaZero">AlphaZero</a> is an Artificial Intelligence developed by
            DeepMind to master chess, shogi, and Go.
          </div>
          <div>
            <strong>
              I adapted the original AlphaZero research to play Ultimate Tic-Tac-Toe game in the browser on your device.
            </strong>
          </div>
          <div>
            <a href="https://en.wikipedia.org/wiki/Ultimate_tic-tac-toe">Ultimate Tic-Tac-Toe</a> is an advanced variant
            of the classic Tic-Tac-Toe game that requires long-term strategic thinking. See the{' '}
            <NavLink exact to="/rules">
              /rules
            </NavLink>
            .
          </div>
          <div>
            The AI deployed on uttt.ai evaluates Ultimate Tic-Tac-Toe positions using Monte-Carlo Tree Search guided by
            a neural network. Each MCTS simulation expands the tree based on the Policy-Value Network predictions. When
            num simulations = 1, the evaluation comes directly from the PVN.
          </div>
          <div>
            The position evaluation consist of the state value displayed above the board (a number from -100 to 100) and
            a probability distribution over legal moves (numbers from 0 to 100 adding up to 100).
          </div>
          <div>
            <strong>uttt.ai works best on desktops and gaming laptops.</strong> The better your device is, the faster
            the AI performs simulations. The more simulations AI performs, the better its position evaluation will be.
          </div>
          <div>The AI's self-play training took about 10 weeks on my desktop PC to complete.</div>
          <div>
            Source code: <a href="https://github.com/ar-nowaczynski/uttt">https://github.com/ar-nowaczynski/uttt</a>.
          </div>
          <div className="support">
            <div>If you like this project and want to support it, send me a tip:</div>
            <div className="crypto">
              <div className="coin">BTC</div>
              <div className="address">
                <div>bc1qhzaphd9f7vwzcnadw2k908nksc29s5yf8p8qzh</div>
              </div>
            </div>
            <div className="crypto">
              <div className="coin">ETH</div>
              <div className="address">0xbe3B92e5649c5cA17eBD2ECa7617CA8b6BF471bA</div>
            </div>
            <div className="crypto">
              <div className="coin">ADA</div>
              <div className="address">
                addr1qyfv5hl6mza2z22av4kyssw5us0k4r48ezsa288j6j4n2jqcw9x5lv6lmzv289ddqaxj47pwc30gn5gfurx5eltfx90qvj0a4d
              </div>
            </div>
          </div>
          <div className="farewell">Thanks and have fun!</div>
        </div>
      </div>
    );
  }
}

export default About;
