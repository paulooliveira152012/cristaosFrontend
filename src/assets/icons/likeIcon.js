import * as React from "react";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={21}
    height={19}
    fill="none"
    viewBox="0 0 21 19"
    {...props}
  >
    <path
      stroke="#484C52"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.378}
      d="M10.614 4.37C8.477-.646 1-.112 1 6.297c0 6.41 9.614 11.75 9.614 11.75s9.613-5.34 9.613-11.75-7.477-6.943-9.613-1.929Z"
    />
  </svg>
);
export default SVGComponent;
