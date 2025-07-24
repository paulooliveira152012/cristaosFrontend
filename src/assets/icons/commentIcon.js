import * as React from "react";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    fill="none"
    viewBox="0 0 18 18"
    {...props}
  >
    <path
      stroke="#484C52"
      strokeLinejoin="round"
      strokeWidth={1.292}
      d="M17 8.653c0 4.227-3.582 7.654-8 7.654a8.46 8.46 0 0 1-1.548-.143c-.367-.07-.55-.104-.679-.084-.128.02-.31.116-.673.31a5.2 5.2 0 0 1-3.38.524 4.234 4.234 0 0 0 .87-1.878c.08-.424-.118-.836-.415-1.137C1.827 12.529 1 10.684 1 8.652 1 4.427 4.582 1 9 1s8 3.427 8 7.653Z"
    />
  </svg>
);
export default SVGComponent;
