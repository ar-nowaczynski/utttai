import React from 'react';
import Helmet from 'react-helmet';
import { NavLink } from 'react-router-dom';

class Blog extends React.Component {
  render() {
    return (
      <div className="blog">
        <Helmet defer={false}>
          <title>uttt.ai – Blog</title>
        </Helmet>
        <h1>Blog</h1>
        <div className="content">
          <div className="post">
            <h2 className="post-title">Project introduction</h2>
            <div className="post-content">
              <p>
                {'This project is a loose adaptation of the original '}
                <a href="https://deepmind.com/blog/article/alphazero-shedding-new-light-grand-games-chess-shogi-and-go">
                  AlphaZero published by Deepmind
                </a>
                {' and provides AlphaZero-like AI solution for playing Ultimate Tic-Tac-Toe game in the browser.'}
              </p>
              <p>
                uttt.ai follows key ideas behind the AlphaZero, such as generating training data from self-play or using
                single neural network to guide the Monte-Carlo Tree Search (MCTS) algorithm. However, the actual
                implementation of these ideas is different due to limitations on the available computing power,
                specifically:
                <ul>
                  <li>
                    AI self-play training must fit on a personal computer within a reasonable time (several weeks).
                  </li>
                  <li>
                    AI inference must run in the browser on the client-side hardware within a reasonable time (a few
                    seconds).
                  </li>
                </ul>
              </p>
              <p>
                The AI deployed on uttt.ai is a very strong player, capable of beating any other publicly available AIs
                that are easily accessible through other websites and mobile apps (see the list at the bottom).
              </p>
              <p>
                uttt.ai gives the best position evaluation (state value and probability distribution over legal moves)
                when the number of simulations is set to at least 1,000 or more.
              </p>
              <p>
                uttt.ai is able to beat novice human players even when num simulations = 1 (which means there is no tree
                search - the evaluation comes directly from the neural network). Try it and see for yourself!
              </p>
              <p>
                {'Source code: '}
                <a className="link" href="https://github.com/ar-nowaczynski/uttt">
                  https://github.com/ar-nowaczynski/uttt
                </a>
                .
              </p>
            </div>
          </div>

          <div className="post">
            <h2 className="post-title">Ultimate Tic-Tac-Toe</h2>
            <div className="post-content">
              <p>
                <a href="https://en.wikipedia.org/wiki/Ultimate_tic-tac-toe">Ultimate Tic-Tac-Toe</a>
                {' (UTTT) is an advanced variant of the well-known '}
                <a href="https://en.wikipedia.org/wiki/Tic-tac-toe">tic-tac-toe</a>
                {' game that requires long-term strategic thinking.'}
              </p>
              <p>
                The goal is to win a supergame (global board) by winning 3 subgames (local boards) in a straight line.
              </p>
              <p>
                The main complexity of the game is due to the existence of two constraints on player moves:
                <ul>
                  <li>
                    The X's most recent move determines a subgame (local board) for the O's next move and vice-versa.
                  </li>
                  <li>
                    If a player is sent to a finished subgame, all unfinished subgames become available for the next
                    move.
                  </li>
                </ul>
              </p>
              <p>
                {`If you want to understand the Ultimate Tic-Tac-Toe rules visually, see the `}
                <NavLink exact to="/rules">
                  /rules
                </NavLink>
                .
              </p>
              <p>
                {'The average length of a UTTT game is between 40 and 50 '}
                <a href="https://en.wikipedia.org/wiki/Ply_(game_theory)">plies</a>. The average number of legal moves
                per position is around 7. Both values are estimated from the self-play training data.
              </p>
            </div>
          </div>

          <div className="post">
            <h2 className="post-title">What is AlphaZero?</h2>
            <div className="post-content">
              <p>
                <a href="https://en.wikipedia.org/wiki/AlphaZero">AlphaZero</a> is an Artificial Intelligence developed
                by DeepMind to master chess, shogi, and Go.
              </p>
              <p>
                It consist of Monte-Carlo Tree Search guided by a neural network trained via self-play from scratch.
              </p>
              <p>
                Read more:
                <ul>
                  <li>
                    <a href="https://www.nature.com/articles/nature16961">AlphaGo (nature)</a>
                  </li>
                  <li>
                    <a href="https://www.nature.com/articles/nature24270">AlphaGo Zero (nature)</a>
                  </li>
                  <li>
                    <a href="https://arxiv.org/abs/1712.01815">AlphaZero (arxiv)</a>
                  </li>
                  <li>
                    <a href="https://arxiv.org/abs/1911.08265">MuZero (arxiv)</a>
                  </li>
                </ul>
              </p>
            </div>
          </div>

          <div className="post">
            <h2 className="post-title">Differences from the original AlphaZero</h2>
            <div className="post-content">
              <p>
                This project differs from the original AlphaZero research due to limitations on the available computing
                power for training and inference.
              </p>
              <p>
                Deepmind utilized 5,000 TPUv1 + 64 TPUv2 for self-play training, and its models weren't
                designed/published to run inference in the browser.
              </p>
              <p>
                This project used single desktop PC with i7-10700K and 2x RTX 2080 Ti for self-play training, and the
                resulting AI was deployed to run inference in the browser.
              </p>
              <p>
                The main differences from the original AlphaZero are listed below:
                <ul>
                  <li>
                    Much smaller Policy-Value Network (PVN) architecture designed specifically for playing Ultimate
                    Tic-Tac-Toe in the browser with only 5 million parameters (20 MB):{' '}
                    <a href="https://github.com/ar-nowaczynski/uttt/blob/main/utttpy/selfplay/policy_value_network.py">
                      source code
                    </a>
                    .
                  </li>
                  <li>
                    Total separation of self-play data generation process from the Policy-Value Network training
                    (offline RL).
                  </li>
                  <li>More MCTS simulations per position for training (self-play data quality over quantity).</li>
                  <li>
                    The initial self-play dataset was generated from pure MCTS simulations (random playouts are faster
                    and better than random Policy-Value Network predictions).
                  </li>
                  <li>Search simulations are synchronous, single-threaded and sequential.</li>
                  <li>Enabled data augmentation by flipping the board during the Policy-Value Network training.</li>
                  <li>
                    Value target for MSE loss function is defined as the root's mean state value rather than the game
                    outcome.
                  </li>
                  <li>Masked KL divergence loss for policy head instead of Cross Entropy loss.</li>
                  <li>Auxiliary policy head loss for predicting action values next to action logits.</li>
                </ul>
              </p>
            </div>
          </div>

          <div className="post">
            <h2 className="post-title">AI self-play with 100,000 simulations</h2>
            <div className="post-content">
              <p>
                The video below shows uttt.ai self-play with 100,000 simulations per move and argmax move selection.
              </p>
              <div className="post-youtube-video-link">
                <a href="https://www.youtube.com/watch?v=oqbHx3NSzaY">
                  <span>https://www.youtube.com/watch?v=oqbHx3NSzaY</span>
                </a>
              </div>
              <div className="post-youtube-video">
                <iframe className="post-youtube-video-iframe" src="https://www.youtube.com/embed/oqbHx3NSzaY"></iframe>
              </div>
            </div>
          </div>
          <div className="post">
            <h2 className="post-title">Strategy for playing Ultimate Tic-Tac-Toe</h2>
            <div className="post-content">
              <p>My strategy for playing Ultimate Tic-Tac-Toe (learned from AI) is as follows:</p>
              <ul>
                <li>
                  Start in the center square of the center subgame (undoubtedly the best move, unless you want to
                  surprise the opponent with something weird).
                </li>
                <li>
                  The 'O' response is to push to the corner subgame, so then let the next 8 moves be played in the
                  corner subgames.
                </li>
                <li>
                  When the 'O' breaks out of the corner subgames, jump between the side subgames (these are the least
                  useful to take, but still, one has to be careful not to mess up here).
                </li>
                <li>
                  Maintain the overall balance on the board and wait for the opponent's mistake (the game is a marathon,
                  not a sprint).
                </li>
                <li>
                  Think twice before sending your opponent to the finished subgame (being able to choose any move from
                  the unfinished subgames is very powerful).
                </li>
              </ul>
            </div>
          </div>

          <div className="post">
            <h2 className="post-title">Various technical details and takeaways</h2>
            <div className="post-content">
              <ul>
                <li>
                  uttt.ai is built using React + onnxruntime and deployed as an Azure Static Web App (shout-out to
                  Microsoft for providing an excellent service).
                </li>
                <li>
                  {'Policy-Value Network is running in the browser on your device using the '}
                  <a href="https://v8.dev/features/simd">WebAssembly SIMD</a>
                  {' backend (CPU only). '}
                  The WebGL backend is an alternative option that enables GPU access, but it doesn't support
                  ConvTranspose2D layer (
                  <a href="https://github.com/microsoft/onnxruntime/blob/master/js/web/docs/operators.md">
                    WebGl Operators Support Table
                  </a>
                  ) needed for PVN.
                </li>
                <li>
                  The computing hardware used for developing this project was: Intel i7-10700K (8 cores x 3.80GHz), 2 x
                  RTX 2080 Ti, 64 GB RAM.
                </li>
                <li>
                  The entire AI's self-play training took about 10 weeks on my desktop PC to complete. Most of the time
                  was spent on generating training datasets via self-play in C++.
                </li>
                <li>
                  uttt.ai works best on desktops and gaming laptops. On my desktop PC: 75 simulations / sec, on my
                  laptop: 70 sims/sec, on my phone 2.5 sim/sec. However, single threaded C++ inference that uses GPU
                  offers up to 700 simulations / sec ({`if you're interested to run it, see the `}
                  <a href="https://github.com/ar-nowaczynski/uttt">source code</a>
                  ).
                </li>
                <li>
                  <p>
                    uttt.ai gives the best position evaluation (state value and probability distribution over legal
                    moves) when the number of simulations is set to at least 1,000 or more.
                  </p>
                  <p>{`Take a look at the evaluation for this position (click 'Control both sides' in the menu): `}</p>
                  <p>
                    <NavLink
                      className="link"
                      exact
                      to="/init?actions=x40o38x20o26x80o72x6o60x54o7x70o64x12o28x16o66x30o34x68o50x46o10x14o48x32o52x71o73x13o41x53o74x22"
                    >
                      /init?actions=x40o38x20o26x80o72x6o60x54o7x70o64x12o28x16o66x30o34x68o50x46o10x14o48x32o52x71o73x13o41x53o74x22
                    </NavLink>
                  </p>
                  <p>
                    {
                      'The initial evaluation (num simulations <= 300) suggest that the best move is to win the center subgame. '
                    }
                    Unfortunately, this is a loosing move. The AI finds the better one only after performing more than
                    300 simulations, which results in a draw.
                  </p>
                  <p>
                    This is just one example, but it perfectly illustrates that the Policy-Value Network itself is not
                    always right and more simulations matter.
                  </p>
                </li>
                <li>
                  When I started doing this project, I didn't know how to create websites. To learn it, I read the
                  entire <a href="https://javascript.info/">javascript.info</a> course twice, watched plenty of{' '}
                  <a href="https://www.youtube.com/c/DevEd">Dev Ed's videos</a> and did many small throwaway projects.
                </li>
              </ul>
            </div>
          </div>

          <div className="post">
            <h2 className="post-title">List of other AIs</h2>
            <div className="post-content">
              List of other public and easily accessible AIs for Ultimate Tic-Tac-Toe:
              <ul>
                <li>
                  <a className="link" href="https://www.theofekfoundation.org/games/UltimateTicTacToe/">
                    https://www.theofekfoundation.org/games/UltimateTicTacToe/
                  </a>
                </li>
                <li>
                  <a className="link" href="https://ultimate-t3.herokuapp.com/local-game">
                    https://ultimate-t3.herokuapp.com/local-game
                  </a>
                </li>
                <li>
                  <a href="https://play.google.com/store/apps/details?id=com.ZeroRare.UltimateTicTacToe&hl=en&gl=US">
                    Ultimate Tic Tac Toe by Levi Moore (Google Play)
                  </a>
                </li>
                <li>
                  <a href="https://play.google.com/store/apps/details?id=com.application.ultimatetictactoc&hl=en&gl=US">
                    Ultimate Tic Tac Toe by Kirti Jagtap (Google Play)
                  </a>
                </li>
                <li>
                  <a href="https://play.google.com/store/apps/details?id=com.magmamobile.game.UltimateTicTacToe&hl=en&gl=US">
                    Ultimate Tic Tac Toe by Magma Mobile (Google Play)
                  </a>
                  <br></br>
                  <a href="https://apps.apple.com/us/app/ultimate-tic-tac-toe/id971030546">
                    Ultimate Tic Tac Toe by Magma Mobile (App Store)
                  </a>
                </li>
                <li>
                  <a href="https://play.google.com/store/apps/details?id=com.fullrandomstudio.ultimatetictactoe">
                    Ultimate Tic Tac Toe by FullRandom Studio (Google Play)
                  </a>
                </li>
              </ul>
              <p>uttt.ai beats them all!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Blog;
