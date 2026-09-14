const BUILD = 'ready4';

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

import './startup-loading.js?v=ready4';
import './readiness-sprint.js?v=ready4';
import './auth-hardening.js?v=ready4';
import './core-app.js?v=ready4';
import './edge-workouts.js?v=ready4';
import './qa-enhancements.js?v=ready4';
import './starting-point.js?v=ready4';
import './arc-roundout.js?v=ready4';
import './body-analytics.js?v=ready4';
import './training-roundout.js?v=ready4';
import './nutrition-plumbing.js?v=ready4';