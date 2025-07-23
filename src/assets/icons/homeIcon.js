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
      <path
        fill="#484C52"
        d="M13.338.833a2 2 0 0 0-2.676 0L0 10.43v10.4a3.2 3.2 0 0 0 3.2 3.2h17.6a3.2 3.2 0 0 0 3.2-3.2v-10.4L13.338.833ZM15 22.026H9V17a3 3 0 1 1 6 0v5.026Zm7-1.2a1.2 1.2 0 0 1-1.2 1.2H17V17a5 5 0 0 0-10 0v5.026H3.2a1.2 1.2 0 0 1-1.2-1.2V11.32l10-9 10 9v9.507Z"
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
