const BUILD = 'ready10';

const addStyle = (href) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${href}?v=${BUILD}`;
  document.head.appendChild(link);
};

addStyle('./core-roundout.css');
addStyle('./eclipse-arc.css');
addStyle('./eclipse-arc-motion.css');
addStyle('./arc-eclipse-v4.css');
addStyle('./training-roundout.css');
addStyle('./nutrition-plumbing.css');
addStyle('./readiness-sprint.css');
addStyle('./qa-enhancements.css');
addStyle('./starting-point.css');
addStyle('./arc-motion-bootstrap.css');
addStyle('./arc-icons.css');
addStyle('./arc-icon-details.css');
addStyle('./pwa-polish.css');
addStyle('./what-arc-sees.css');

import './pwa-polish.js?v=ready10';
import './startup-loading.js?v=ready10';
import './arc-motion-bootstrap.js?v=ready10';
import './readiness-sprint.js?v=ready10';
import './auth-hardening.js?v=ready10';
import './core-app.js?v=ready10';
import './edge-workouts.js?v=ready10';
import './qa-enhancements.js?v=ready10';
import './starting-point.js?v=ready10';
import './arc-roundout.js?v=ready10';
import './body-analytics.js?v=ready10';
import './training-roundout.js?v=ready10';
import './nutrition-plumbing.js?v=ready10';
import './arc-icons.js?v=ready10';
import './arc-icon-details.js?v=ready10';
import './what-arc-sees.js?v=ready10';