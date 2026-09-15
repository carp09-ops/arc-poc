const BUILD = 'ready20';

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
/* v6 is the final visual authority: Safari-safe corona, composition and safe-area fixes. */
addStyle('./arc-visual-v6.css');

import './pwa-polish.js?v=ready20';
import './arc-icons.js?v=ready20';
import './arc-icon-details.js?v=ready20';
import './startup-loading.js?v=ready20';
import './arc-motion-bootstrap.js?v=ready20';
import './readiness-sprint.js?v=ready20';
import './auth-hardening.js?v=ready20';
import './core-app.js?v=ready20';
import './edge-workouts.js?v=ready20';
import './qa-enhancements.js?v=ready20';
import './starting-point.js?v=ready20';
import './arc-roundout.js?v=ready20';
import './body-analytics.js?v=ready20';
import './training-roundout.js?v=ready20';
import './nutrition-plumbing.js?v=ready20';
import './what-arc-sees.js?v=ready20';
import './privacy-controls.js?v=ready20';
import './workout-engine-badge.js?v=ready20';
import './view-reset.js?v=ready20';
