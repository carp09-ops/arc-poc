const BUILD = 'ready18';

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
/* Eclipse v5 intentionally loads last so legacy gauge/mobile CSS cannot re-frame it. */
addStyle('./arc-eclipse-v5.css');

import './pwa-polish.js?v=ready18';
import './arc-icons.js?v=ready18';
import './arc-icon-details.js?v=ready18';
import './startup-loading.js?v=ready18';
import './arc-motion-bootstrap.js?v=ready18';
import './readiness-sprint.js?v=ready18';
import './auth-hardening.js?v=ready18';
import './core-app.js?v=ready18';
import './edge-workouts.js?v=ready18';
import './qa-enhancements.js?v=ready18';
import './starting-point.js?v=ready18';
import './arc-roundout.js?v=ready18';
import './body-analytics.js?v=ready18';
import './training-roundout.js?v=ready18';
import './nutrition-plumbing.js?v=ready18';
import './what-arc-sees.js?v=ready18';
import './privacy-controls.js?v=ready18';
import './workout-engine-badge.js?v=ready18';
