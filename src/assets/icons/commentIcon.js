import * as React from "react";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={19}
    height={19}
    fill="none"
    viewBox="0 0 19 19"
    {...props}
  >
    <path
      stroke="#484C52"
      strokeLinejoin="round"
      strokeWidth={1.38}
      d="M18.205 9.175c0 4.515-3.827 8.175-8.546 8.175a8.9 8.9 0 0 1-1.653-.152c-.392-.074-.588-.111-.725-.09-.137.02-.331.124-.72.33A5.553 5.553 0 0 1 2.952 18a4.522 4.522 0 0 0 .929-2.006c.085-.453-.127-.893-.444-1.215-1.44-1.463-2.323-3.434-2.323-5.603C1.114 4.66 4.94 1 9.659 1c4.72 0 8.546 3.66 8.546 8.175Z"
    />
  </svg>
);
export default SVGComponent;
