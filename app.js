const BUILD = 'ready25';

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
/* Living Arc is now the sole progress visual. */
addStyle('./arc-living-v1.css');

import './pwa-polish.js?v=ready25';
import './arc-icons.js?v=ready25';
import './arc-icon-details.js?v=ready25';
import './startup-loading.js?v=ready25';
import './arc-motion-bootstrap.js?v=ready25';
import './readiness-sprint.js?v=ready25';
import './auth-hardening.js?v=ready25';
import './core-app.js?v=ready25';
import './edge-workouts.js?v=ready25';
import './qa-enhancements.js?v=ready25';
import './starting-point.js?v=ready25';
import './arc-living-v1.js?v=ready25';
import './arc-roundout.js?v=ready25';
import './body-analytics.js?v=ready25';
import './training-roundout.js?v=ready25';
import './nutrition-plumbing.js?v=ready25';
import './what-arc-sees.js?v=ready25';
import './privacy-controls.js?v=ready25';
import './workout-engine-badge.js?v=ready25';
import './view-reset.js?v=ready25';
