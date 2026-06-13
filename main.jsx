import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './background.js';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Secret staff area at /staff — lazy-loaded so its code isn't in the main bundle.
if (window.location.pathname.replace(/\/$/, '') === '/staff') {
  import('./staff.jsx').then(({ default: StaffApp }) => {
    root.render(<StaffApp />);
  });
} else {
  import('./app.jsx').then(({ default: App }) => {
    root.render(<App />);
  });
}
