import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// signal the inline loader to hide once the app has mounted (and fonts settled)
function signalReady() {
  const fire = () => {
    if (typeof window.__nkmaReady === 'function') window.__nkmaReady();
    window.dispatchEvent(new Event('nkma-ready'));
  };
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fonts.then(fire);
  setTimeout(fire, 400); // fallback in case fonts hang
}

// Secret staff area at /staff — lazy-loaded so its code isn't in the main bundle.
if (window.location.pathname.replace(/\/$/, '') === '/staff') {
  import('./staff.jsx').then(({ default: StaffApp }) => {
    root.render(<StaffApp />);
    signalReady();
  });
} else {
  import('./app.jsx').then(({ default: App }) => {
    root.render(<App />);
    signalReady();
  });
}
