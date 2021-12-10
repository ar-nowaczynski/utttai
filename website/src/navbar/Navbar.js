import React from 'react';
import { NavLink } from 'react-router-dom';
import { joinClassNames } from '../global/classnames';
import MenuLinesIcon from '../images/menu-lines.svg';
import SettingsWheelIcon from '../images/settings-wheel.svg';

class DesktopNavbar extends React.PureComponent {
  handleTitleClick = () => {
    const { closeSettingsModal } = this.props;
    closeSettingsModal();
  };

  handleRulesClick = () => {
    const { closeSettingsModal } = this.props;
    closeSettingsModal();
  };

  handleBlogClick = () => {
    const { closeSettingsModal } = this.props;
    closeSettingsModal();
  };

  handleAboutClick = () => {
    const { closeSettingsModal } = this.props;
    closeSettingsModal();
  };

  handleRestartGameClick = () => {
    const { resetGameline, closeGameMenu, closeSettingsModal } = this.props;
    resetGameline(true, true, true);
    closeGameMenu(false);
    closeSettingsModal();
  };

  handleOpenGameMenuClick = () => {
    const { openGameMenu, resetGameline, closeSettingsModal } = this.props;
    openGameMenu();
    resetGameline(false, false, false);
    closeSettingsModal();
  };

  handleOpenInitCopyClick = () => {
    const { closeSettingsModal, openInitCopyModal } = this.props;
    closeSettingsModal();
    openInitCopyModal();
  };

  renderNavDropdown() {
    const { gamePath, routePath } = this.props;
    const isGameRoutePath = routePath === '/' || routePath === '/init';
    return (
      <div className={joinClassNames('nav-dropdown', !isGameRoutePath ? 'suppressed' : null)}>
        <NavLink className="nav-dropdown-link" exact to={gamePath} onClick={this.handleRestartGameClick}>
          <span>Restart game</span>
        </NavLink>

        <NavLink className="nav-dropdown-link" exact to={gamePath} onClick={this.handleOpenGameMenuClick}>
          <span>Game menu</span>
        </NavLink>

        <NavLink className="nav-dropdown-link" exact to={gamePath} onClick={this.handleOpenInitCopyClick}>
          <span>Copy /init</span>
        </NavLink>
      </div>
    );
  }

  renderSettingsButton() {
    const { handleSettingsClick } = this.props;
    return (
      <button className="settings-button" onClick={handleSettingsClick} type="button">
        <SettingsWheelIcon className="settings-button-icon" />
        <span className="settings-button-label">Settings</span>
      </button>
    );
  }

  render() {
    const { gamePath } = this.props;
    return (
      <nav className="desktop nav-bar">
        <div className="desktop nav-menu">
          <ul className="desktop nav-links">
            <li className="desktop nav-item title">
              <NavLink className="desktop nav-link title" exact to={gamePath} onClick={this.handleTitleClick}>
                <span>uttt.ai</span>
              </NavLink>
              {this.renderNavDropdown()}
            </li>
            <li className="desktop nav-item">
              <NavLink className="desktop nav-link" exact to="/rules" onClick={this.handleRulesClick}>
                <span>Rules</span>
              </NavLink>
            </li>
            <li className="desktop nav-item">
              <NavLink className="desktop nav-link" exact to="/blog" onClick={this.handleBlogClick}>
                <span>Blog</span>
              </NavLink>
            </li>
            <li className="desktop nav-item">
              <NavLink className="desktop nav-link" exact to="/about" onClick={this.handleAboutClick}>
                <span>About</span>
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="desktop nav-settings">{this.renderSettingsButton()}</div>
      </nav>
    );
  }
}

class MobileNavbar extends React.PureComponent {
  handleResumeGameClick = () => {
    const { resumeSimulations, closeMenuSidebar } = this.props;
    resumeSimulations();
    closeMenuSidebar();
  };

  handleRestartGameClick = () => {
    const { resetGameline, closeGameMenu, closeMenuSidebar } = this.props;
    resetGameline(true, true, true);
    closeGameMenu(false);
    closeMenuSidebar();
  };

  handleOpenGameMenuClick = () => {
    const { openGameMenu, resetGameline, closeMenuSidebar } = this.props;
    openGameMenu();
    resetGameline(false, false, false);
    closeMenuSidebar();
  };

  handleOpenInitCopyClick = () => {
    const { openInitCopyModal, closeMenuSidebar } = this.props;
    openInitCopyModal();
    closeMenuSidebar();
  };

  handleRulesClick = () => {
    const { closeMenuSidebar } = this.props;
    closeMenuSidebar();
  };

  handleBlogClick = () => {
    const { closeMenuSidebar } = this.props;
    closeMenuSidebar();
  };

  handleAboutClick = () => {
    const { closeMenuSidebar } = this.props;
    closeMenuSidebar();
  };

  renderMenuButton() {
    const { handleMenuClick } = this.props;
    return (
      <button className="menu-button" onClick={handleMenuClick} type="button">
        <MenuLinesIcon className="menu-button-icon" />
        <span className="menu-button-label">Menu</span>
      </button>
    );
  }

  renderMenuSidebar() {
    const { isMenuSidebarOpened, gamePath, routePath } = this.props;
    const isGameRoutePath = routePath === '/' || routePath === '/init';
    return (
      <ul className={joinClassNames('mobile', 'nav-links', isMenuSidebarOpened ? 'visible' : null)}>
        <li className="mobile nav-item">
          <NavLink className="mobile nav-link" exact to={gamePath} onClick={this.handleResumeGameClick}>
            <span>Resume game</span>
          </NavLink>
        </li>
        <li className={joinClassNames('mobile nav-item', !isGameRoutePath ? 'suppressed' : null)}>
          <NavLink className="mobile nav-link" exact to={gamePath} onClick={this.handleRestartGameClick}>
            <span>Restart game</span>
          </NavLink>
        </li>
        <li className={joinClassNames('mobile nav-item', !isGameRoutePath ? 'suppressed' : null)}>
          <NavLink className="mobile nav-link" exact to={gamePath} onClick={this.handleOpenGameMenuClick}>
            <span>Game menu</span>
          </NavLink>
        </li>
        <li className={joinClassNames('mobile nav-item', !isGameRoutePath ? 'suppressed' : null)}>
          <NavLink className="mobile nav-link" exact to={gamePath} onClick={this.handleOpenInitCopyClick}>
            <span>Copy /init</span>
          </NavLink>
        </li>
        <li className="mobile nav-item">
          <NavLink className="mobile nav-link" exact to="/rules" onClick={this.handleRulesClick}>
            <span>/rules</span>
          </NavLink>
        </li>
        <li className="mobile nav-item">
          <NavLink className="mobile nav-link" exact to="/blog" onClick={this.handleBlogClick}>
            <span>/blog</span>
          </NavLink>
        </li>
        <li className="mobile nav-item">
          <NavLink className="mobile nav-link" exact to="/about" onClick={this.handleAboutClick}>
            <span>/about</span>
          </NavLink>
        </li>
      </ul>
    );
  }

  renderMenuBackground() {
    const { isMenuSidebarOpened, closeMenuSidebar } = this.props;
    if (isMenuSidebarOpened) {
      return <div className="mobile nav-background" onClick={closeMenuSidebar}></div>;
    }
  }

  renderSettingsButton() {
    const { handleSettingsClick, closeMenuSidebar } = this.props;
    return (
      <button
        className="settings-button"
        onClick={() => {
          handleSettingsClick();
          closeMenuSidebar();
        }}
        type="button"
      >
        <SettingsWheelIcon className="settings-button-icon" />
        <span className="settings-button-label">Settings</span>
      </button>
    );
  }

  render() {
    return (
      <nav className="mobile nav-bar">
        {this.renderMenuBackground()}
        <div className="mobile nav-menu">
          {this.renderMenuButton()}
          {this.renderMenuSidebar()}
        </div>
        <div className="mobile title">uttt.ai</div>
        <div className="mobile nav-settings">{this.renderSettingsButton()}</div>
      </nav>
    );
  }
}

export { DesktopNavbar, MobileNavbar };
