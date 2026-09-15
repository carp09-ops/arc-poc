const BUILD = 'ready22';

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
addStyle('./arc-eclipse-v5.css');
addStyle('./arc-visual-v6.css');
/* v7 is the final visual authority: real photographed corona, no synthetic spokes. */
addStyle('./arc-visual-v7.css');

import './pwa-polish.js?v=ready22';
import './arc-icons.js?v=ready22';
import './arc-icon-details.js?v=ready22';
import './startup-loading.js?v=ready22';
import './arc-motion-bootstrap.js?v=ready22';
import './readiness-sprint.js?v=ready22';
import './auth-hardening.js?v=ready22';
import './core-app.js?v=ready22';
import './edge-workouts.js?v=ready22';
import './qa-enhancements.js?v=ready22';
import './starting-point.js?v=ready22';
import './arc-roundout.js?v=ready22';
import './body-analytics.js?v=ready22';
import './training-roundout.js?v=ready22';
import './nutrition-plumbing.js?v=ready22';
import './what-arc-sees.js?v=ready22';
import './privacy-controls.js?v=ready22';
import './workout-engine-badge.js?v=ready22';
import './view-reset.js?v=ready22';
