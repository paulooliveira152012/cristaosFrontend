import * as React from "react";
const Plus = (props) => (
  <svg
    width={37}
    height={37}
    viewBox="0 0 37 37"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx={18.5} cy={18.5} r={18.5} fill="#002D9F" />
    <line x1={18.5} y1={9} x2={18.5} y2={30} stroke="white" />
    <line x1={7} y1={19.5} x2={30} y2={19.5} stroke="white" />
  </svg>
);
export default Plus;
