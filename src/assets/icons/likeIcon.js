import * as React from "react";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={18}
    fill="none"
    viewBox="0 0 20 18"
    {...props}
  >
    <path
      stroke="#484C52"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.29}
      d="M10 4.154C8-.54 1-.04 1 5.96s9 11 9 11 9-5 9-11-7-6.5-9-1.806Z"
    />
  </svg>
);
export default SVGComponent;
