const BUILD = 'ready3';

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

import './readiness-sprint.js?v=ready3';
import './core-app.js?v=ready3';
import './edge-workouts.js?v=ready3';
import './qa-enhancements.js?v=ready3';
import './starting-point.js?v=ready3';
import './arc-roundout.js?v=ready3';
import './body-analytics.js?v=ready3';
import './training-roundout.js?v=ready3';
import './nutrition-plumbing.js?v=ready3';