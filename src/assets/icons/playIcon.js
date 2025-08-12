import * as React from "react";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={22}
    height={23}
    fill="none"
    viewBox="0 0 22 23"
    {...props}
  >
    <path
      stroke="#484C52"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.78}
      d="M1 19.14V3.86c0-1.26 0-1.89.267-2.263.233-.325.592-.539.99-.59.456-.058 1.016.238 2.134.83l14.415 7.64.005.003c1.236.655 1.854.982 2.056 1.419.177.38.177.82 0 1.201-.203.437-.822.766-2.061 1.423l-14.415 7.64c-1.119.593-1.677.888-2.134.83a1.442 1.442 0 0 1-.99-.59C1 21.03 1 20.4 1 19.14Z"
    />
  </svg>
);
export default SVGComponent;
