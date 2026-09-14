const BUILD = 'ready7';

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

import './pwa-polish.js?v=ready7';
import './startup-loading.js?v=ready7';
import './arc-motion-bootstrap.js?v=ready7';
import './readiness-sprint.js?v=ready7';
import './auth-hardening.js?v=ready7';
import './core-app.js?v=ready7';
import './edge-workouts.js?v=ready7';
import './qa-enhancements.js?v=ready7';
import './starting-point.js?v=ready7';
import './arc-roundout.js?v=ready7';
import './body-analytics.js?v=ready7';
import './training-roundout.js?v=ready7';
import './nutrition-plumbing.js?v=ready7';
import './arc-icons.js?v=ready7';
import './arc-icon-details.js?v=ready7';