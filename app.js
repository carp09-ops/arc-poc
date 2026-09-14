const BUILD = 'ready15';

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
addStyle('./privacy-controls.css');
addStyle('./workout-engine-badge.css');

import './pwa-polish.js?v=ready15';
import './arc-icons.js?v=ready15';
import './arc-icon-details.js?v=ready15';
import './startup-loading.js?v=ready15';
import './arc-motion-bootstrap.js?v=ready15';
import './readiness-sprint.js?v=ready15';
import './auth-hardening.js?v=ready15';
import './core-app.js?v=ready15';
import './edge-workouts.js?v=ready15';
import './qa-enhancements.js?v=ready15';
import './starting-point.js?v=ready15';
import './arc-roundout.js?v=ready15';
import './body-analytics.js?v=ready15';
import './training-roundout.js?v=ready15';
import './nutrition-plumbing.js?v=ready15';
import './what-arc-sees.js?v=ready15';
import './privacy-controls.js?v=ready15';
import './workout-engine-badge.js?v=ready15';
