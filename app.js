const BUILD = 'ready6';

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

import './startup-loading.js?v=ready6';
import './arc-motion-bootstrap.js?v=ready6';
import './readiness-sprint.js?v=ready6';
import './auth-hardening.js?v=ready6';
import './core-app.js?v=ready6';
import './edge-workouts.js?v=ready6';
import './qa-enhancements.js?v=ready6';
import './starting-point.js?v=ready6';
import './arc-roundout.js?v=ready6';
import './body-analytics.js?v=ready6';
import './training-roundout.js?v=ready6';
import './nutrition-plumbing.js?v=ready6';
import './arc-icons.js?v=ready6';