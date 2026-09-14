const roundoutStyle = document.createElement('link');
roundoutStyle.rel = 'stylesheet';
roundoutStyle.href = './core-roundout.css';
document.head.appendChild(roundoutStyle);

const eclipseStyle = document.createElement('link');
eclipseStyle.rel = 'stylesheet';
eclipseStyle.href = './eclipse-arc.css';
document.head.appendChild(eclipseStyle);

const trainingStyle = document.createElement('link');
trainingStyle.rel = 'stylesheet';
trainingStyle.href = './training-roundout.css';
document.head.appendChild(trainingStyle);

import './core-app.js';
import './edge-workouts.js';
import './qa-enhancements.js';
import './starting-point.js';
import './arc-roundout.js';
import './body-analytics.js';
import './training-roundout.js';