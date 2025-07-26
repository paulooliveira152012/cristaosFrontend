import * as React from "react";

const PlusIconSolid = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={23}
    height={23}
    fill="none"
    viewBox="0 0 23 23"
    {...props}
  >
    <circle
      cx={11.5}
      cy={11.5}
      r={10.569}
      fill="#2A68D8"
      stroke="#2A68D8"
      strokeWidth={1.861}
    />
    <path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.558}
      d="M6 11.5h5.5m0 0H17m-5.5 0V17m0-5.5V6"
    />
  </svg>
);

export default PlusIconSolid;
