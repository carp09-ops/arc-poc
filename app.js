const BUILD = 'ready16';

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

import './pwa-polish.js?v=ready16';
import './arc-icons.js?v=ready16';
import './arc-icon-details.js?v=ready16';
import './startup-loading.js?v=ready16';
import './arc-motion-bootstrap.js?v=ready16';
import './readiness-sprint.js?v=ready16';
import './auth-hardening.js?v=ready16';
import './core-app.js?v=ready16';
import './edge-workouts.js?v=ready16';
import './qa-enhancements.js?v=ready16';
import './starting-point.js?v=ready16';
import './arc-roundout.js?v=ready16';
import './body-analytics.js?v=ready16';
import './training-roundout.js?v=ready16';
import './nutrition-plumbing.js?v=ready16';
import './what-arc-sees.js?v=ready16';
import './privacy-controls.js?v=ready16';
import './workout-engine-badge.js?v=ready16';
