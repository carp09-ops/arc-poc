const BUILD = 'ready5';

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

import './startup-loading.js?v=ready5';
import './arc-motion-bootstrap.js?v=ready5';
import './readiness-sprint.js?v=ready5';
import './auth-hardening.js?v=ready5';
import './core-app.js?v=ready5';
import './edge-workouts.js?v=ready5';
import './qa-enhancements.js?v=ready5';
import './starting-point.js?v=ready5';
import './arc-roundout.js?v=ready5';
import './body-analytics.js?v=ready5';
import './training-roundout.js?v=ready5';
import './nutrition-plumbing.js?v=ready5';