import './styles.css';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.querySelector('#app'));

// clear selection when the focus leaves the window
window.addEventListener('blur', () => document.getSelection().empty());
