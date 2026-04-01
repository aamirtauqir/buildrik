/**
 * Aquibra Animation Presets CSS
 * @license BSD-3-Clause
 */

export const animationCSS = `
/* Entrance Animations */
@keyframes aqb-fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes aqb-fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes aqb-fadeInDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes aqb-fadeInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes aqb-fadeInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes aqb-zoomIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes aqb-bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes aqb-slideInUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes aqb-slideInDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

@keyframes aqb-flipInX {
  from { transform: perspective(400px) rotateX(90deg); opacity: 0; }
  to { transform: perspective(400px) rotateX(0); opacity: 1; }
}

@keyframes aqb-flipInY {
  from { transform: perspective(400px) rotateY(90deg); opacity: 0; }
  to { transform: perspective(400px) rotateY(0); opacity: 1; }
}

@keyframes aqb-rotateIn {
  from { transform: rotate(-200deg); opacity: 0; }
  to { transform: rotate(0); opacity: 1; }
}

/* Attention Animations */
@keyframes aqb-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes aqb-bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-30px); }
  60% { transform: translateY(-15px); }
}

@keyframes aqb-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}

@keyframes aqb-swing {
  20% { transform: rotate(15deg); }
  40% { transform: rotate(-10deg); }
  60% { transform: rotate(5deg); }
  80% { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
}

@keyframes aqb-wobble {
  0% { transform: translateX(0%); }
  15% { transform: translateX(-25%) rotate(-5deg); }
  30% { transform: translateX(20%) rotate(3deg); }
  45% { transform: translateX(-15%) rotate(-3deg); }
  60% { transform: translateX(10%) rotate(2deg); }
  75% { transform: translateX(-5%) rotate(-1deg); }
  100% { transform: translateX(0%); }
}

@keyframes aqb-flash {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0; }
}

@keyframes aqb-heartBeat {
  0% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
}

@keyframes aqb-rubberBand {
  0% { transform: scale(1); }
  30% { transform: scaleX(1.25) scaleY(0.75); }
  40% { transform: scaleX(0.75) scaleY(1.25); }
  50% { transform: scaleX(1.15) scaleY(0.85); }
  65% { transform: scaleX(0.95) scaleY(1.05); }
  75% { transform: scaleX(1.05) scaleY(0.95); }
  100% { transform: scale(1); }
}

/* Exit Animations */
@keyframes aqb-fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes aqb-fadeOutUp {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-30px); }
}

@keyframes aqb-fadeOutDown {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(30px); }
}

@keyframes aqb-zoomOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.5); }
}

@keyframes aqb-slideOutUp {
  from { transform: translateY(0); }
  to { transform: translateY(-100%); }
}

/* Utility Classes */
.aqb-animated {
  animation-fill-mode: both;
}

.aqb-infinite {
  animation-iteration-count: infinite;
}

.aqb-delay-100 { animation-delay: 100ms; }
.aqb-delay-200 { animation-delay: 200ms; }
.aqb-delay-300 { animation-delay: 300ms; }
.aqb-delay-500 { animation-delay: 500ms; }
.aqb-delay-1000 { animation-delay: 1000ms; }

.aqb-duration-fast { animation-duration: 300ms; }
.aqb-duration-normal { animation-duration: 600ms; }
.aqb-duration-slow { animation-duration: 1000ms; }
`;

export const injectAnimationCSS = () => {
  if (typeof document === "undefined") return;

  const styleId = "aqb-animation-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = animationCSS;
  document.head.appendChild(style);
};

export default animationCSS;
