import * as React from "react";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <g clipPath="url(#a)">
      <path fill="#222" d="M12 14a3 3 0 0 0-3 3v7.026h6V17a3 3 0 0 0-3-3Z" />
      <path
        fill="#222"
        d="M13.338.833a2 2 0 0 0-2.676 0L0 10.43v10.4a3.2 3.2 0 0 0 3.2 3.2H7V17a5 5 0 1 1 10 0v7.026h3.8a3.2 3.2 0 0 0 3.2-3.2v-10.4L13.338.833Z"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h24v24H0z" />
      </clipPath>
    </defs>
  </svg>
);
export default SVGComponent;
