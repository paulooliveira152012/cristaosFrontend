import * as React from "react";

const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={23}
    height={23}
    fill="none"
    viewBox="0 0 23 23"
    {...props} // permite aplicar `color` externamente com className ou style
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.558}
      d="M6 11.5h5.5m0 0H17m-5.5 0V17m0-5.5V6"
    />
    <circle
      cx={11.5}
      cy={11.5}
      r={10.569}
      stroke="currentColor"
      strokeWidth={1.861}
    />
  </svg>
);

export default SVGComponent;
