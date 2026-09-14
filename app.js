const BUILD = 'ready13';

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

import './pwa-polish.js?v=ready13';
import './startup-loading.js?v=ready13';
import './arc-motion-bootstrap.js?v=ready13';
import './readiness-sprint.js?v=ready13';
import './auth-hardening.js?v=ready13';
import './core-app.js?v=ready13';
import './edge-workouts.js?v=ready13';
import './qa-enhancements.js?v=ready13';
import './starting-point.js?v=ready13';
import './arc-roundout.js?v=ready13';
import './body-analytics.js?v=ready13';
import './training-roundout.js?v=ready13';
import './nutrition-plumbing.js?v=ready13';
import './arc-icons.js?v=ready13';
import './arc-icon-details.js?v=ready13';
import './what-arc-sees.js?v=ready13';
import './privacy-controls.js?v=ready13';
import './workout-engine-badge.js?v=ready13';
