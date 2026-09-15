const BUILD = 'ready27';

/* Keep the installed iOS/PWA identity aligned with the Radiant Horizon brand. Safari 26+ supports SVG Home Screen icons. */
function syncHeadBranding() {
  document.querySelectorAll('link[rel="apple-touch-icon"],link[rel="icon"]').forEach(node => node.remove());
  const touch = document.createElement('link');
  touch.rel = 'apple-touch-icon';
  touch.href = `./assets/arc-icon-sunrise.svg?v=${BUILD}`;
  document.head.appendChild(touch);
  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/svg+xml';
  icon.href = `./assets/arc-icon-sunrise.svg?v=${BUILD}`;
  document.head.appendChild(icon);
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.content = '#0B1A2B';
}
syncHeadBranding();

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
addStyle('./arc-northstar-v1.css');
addStyle('./arc-radiant-v1.css');

import './pwa-polish.js?v=ready27';
import './arc-icons.js?v=ready27';
import './arc-icon-details.js?v=ready27';
import './startup-loading.js?v=ready27';
import './arc-motion-bootstrap.js?v=ready27';
import './readiness-sprint.js?v=ready27';
import './auth-hardening.js?v=ready27';
import './core-app.js?v=ready27';
import './edge-workouts.js?v=ready27';
import './qa-enhancements.js?v=ready27';
import './starting-point.js?v=ready27';
import './arc-radiant-v1.js?v=ready27';
import './arc-roundout.js?v=ready27';
import './body-analytics.js?v=ready27';
import './training-roundout.js?v=ready27';
import './nutrition-plumbing.js?v=ready27';
import './what-arc-sees.js?v=ready27';
import './privacy-controls.js?v=ready27';
import './workout-engine-badge.js?v=ready27';
import './view-reset.js?v=ready27';
