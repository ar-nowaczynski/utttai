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
            <h2 className="post-title">AI self-play with 100,000 simulations</h2>
            <div className="post-content-youtube">
              <div className="post-youtube-video-link">
                <a href="https://www.youtube.com/watch?v=oqbHx3NSzaY">
                  <span>https://www.youtube.com/watch?v=oqbHx3NSzaY</span>
                </a>
              </div>
              <iframe className="post-youtube-video" src="https://www.youtube.com/embed/oqbHx3NSzaY"></iframe>
            </div>
          </div>
          <div className="post">
            <h2 className="post-title">My first win against AI</h2>
            <div className="post-content">
              <p>I played a lot of games as 'X' versus the default AI (num simulations = 1, argmax selection).</p>
              <p>When num simulations = 1 there is no tree search, just raw Policy-Value Network predictions.</p>
              <p>
                It took me maaany trials to finally beat it even though I saw hundreds of evaluated positions during the
                project development.
              </p>
              <p>Here you can see the path of my victory:</p>
              <NavLink
                className="post-init-link"
                exact
                to="/init?actions=x40o38x20o26x80o72x6o60x54o7x70o64x12o28x16o66x30o34x68o50x46o10x14o48x32o52x71o73x13o41x53o74x22o44x24o59x51o61x69o58x3o33x57o29x0"
              >
                /init?actions=x40o38x20o26x80o72x6o60x54o7x70o64x12o28x16o66x30o34x68o50x46o10x14o48x32o52x71o73x13o41x53o74x22o44x24o59x51o61x69o58x3o33x57o29x0
              </NavLink>
              <p>My strategy for playing Ultimate Tic-Tac-Toe (learned from AI) is as follows:</p>
              <p>
                - start in the center square of the center subgame (undoubtedly the best move, unless you want to
                surprise the opponent with something weird)
              </p>
              <p>
                - the 'O' response is to push to the corner subgame, so then let the next 8 moves be played in the
                corner subgames
              </p>
              <p>
                - when the 'O' breaks out of the corner subgames, jump between the side subgames (these are the least
                useful to take, but still, one has to be careful not to mess up here)
              </p>
              <p>After that, I really can't say anything useful except:</p>
              <p>
                - maintain the overall balance on the board and wait for the opponent's mistake (the game is a marathon,
                not a sprint)
              </p>
              <p>
                - think twice before sending your opponent to the finished subgame (being able to choose any move from
                the unfinished subgames is very powerful)
              </p>
              <p>
                Immidiately after my first victory, I decided to look back at the game and find the loosing move by AI.
                Take a look at the evaluation for this position:
              </p>
              <p></p>
              <NavLink
                className="post-init-link"
                exact
                to="/init?actions=x40o38x20o26x80o72x6o60x54o7x70o64x12o28x16o66x30o34x68o50x46o10x14o48x32o52x71o73x13o41x53o74x22"
              >
                /init?actions=x40o38x20o26x80o72x6o60x54o7x70o64x12o28x16o66x30o34x68o50x46o10x14o48x32o52x71o73x13o41x53o74x22
              </NavLink>
              <p>
                The initial evaluation (num simulations = 1) suggest that the best move is to win the center subgame.
              </p>
              <p>
                Although winning the center subgame is a big advantage and seems like a good idea, in this case it was a
                losing move by AI.
              </p>
              <p>
                Find out which move should be played by increasing num simulations up to 1000 for this particular
                position.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Blog;
