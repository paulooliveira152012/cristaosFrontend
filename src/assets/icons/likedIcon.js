import * as React from "react";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={23}
    height={21}
    fill="none"
    viewBox="0 0 23 21"
    {...props}
  >
    <path
      fill="#CE3B3D"
      stroke="#CE3B3D"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.136}
      d="M11.614 5.279C9.477.264 2 .799 2 7.207c0 6.41 9.614 11.75 9.614 11.75s9.613-5.34 9.613-11.75c0-6.409-7.477-6.943-9.613-1.928Z"
    />
  </svg>
);
export default SVGComponent;
