const BUILD = 'ready26';

const addStyle = (href) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${href}?v=${BUILD}`;
  document.head.appendChild(link);
};

addStyle('./core-roundout.css');
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
/* North Star is the final visual layer so legacy light surfaces cannot override it. */
addStyle('./arc-northstar-v1.css');
addStyle('./arc-radiant-v1.css');

import './pwa-polish.js?v=ready26';
import './arc-icons.js?v=ready26';
import './arc-icon-details.js?v=ready26';
import './startup-loading.js?v=ready26';
import './arc-motion-bootstrap.js?v=ready26';
import './readiness-sprint.js?v=ready26';
import './auth-hardening.js?v=ready26';
import './core-app.js?v=ready26';
import './edge-workouts.js?v=ready26';
import './qa-enhancements.js?v=ready26';
import './starting-point.js?v=ready26';
import './arc-radiant-v1.js?v=ready26';
import './arc-roundout.js?v=ready26';
import './body-analytics.js?v=ready26';
import './training-roundout.js?v=ready26';
import './nutrition-plumbing.js?v=ready26';
import './what-arc-sees.js?v=ready26';
import './privacy-controls.js?v=ready26';
import './workout-engine-badge.js?v=ready26';
import './view-reset.js?v=ready26';
