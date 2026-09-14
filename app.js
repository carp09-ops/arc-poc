const roundoutStyle = document.createElement('link');
roundoutStyle.rel = 'stylesheet';
roundoutStyle.href = './core-roundout.css';
document.head.appendChild(roundoutStyle);

const eclipseStyle = document.createElement('link');
eclipseStyle.rel = 'stylesheet';
eclipseStyle.href = './eclipse-arc.css';
document.head.appendChild(eclipseStyle);

const eclipseMotionStyle = document.createElement('link');
eclipseMotionStyle.rel = 'stylesheet';
eclipseMotionStyle.href = './eclipse-arc-motion.css';
document.head.appendChild(eclipseMotionStyle);

const eclipseV4Style = document.createElement('link');
eclipseV4Style.rel = 'stylesheet';
eclipseV4Style.href = './arc-eclipse-v4.css?v=4';
document.head.appendChild(eclipseV4Style);

const trainingStyle = document.createElement('link');
trainingStyle.rel = 'stylesheet';
trainingStyle.href = './training-roundout.css';
document.head.appendChild(trainingStyle);

const nutritionStyle = document.createElement('link');
nutritionStyle.rel = 'stylesheet';
nutritionStyle.href = './nutrition-plumbing.css?v=1';
document.head.appendChild(nutritionStyle);

import './core-app.js';
import './edge-workouts.js';
import './qa-enhancements.js';
import './starting-point.js';
import './arc-roundout.js';
import './body-analytics.js';
import './training-roundout.js';
import './nutrition-plumbing.js?v=1';