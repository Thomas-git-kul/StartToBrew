const React = require("react");
const { View } = require("react-native");

// Minimal mock of react-native-countdown-circle-timer
// Exports a component that renders a simple View and supports children
function CountdownCircleTimer(props) {
  const { children, ...rest } = props || {};
  // If children is a function (render prop), call it with a dummy state
  const content = typeof children === "function" ? children({ remainingTime: 0, elapsedTime: 0 }) : children;
  return React.createElement(View, rest, content);
}

module.exports = CountdownCircleTimer;
module.exports.default = CountdownCircleTimer;
module.exports.CountdownCircleTimer = CountdownCircleTimer;
