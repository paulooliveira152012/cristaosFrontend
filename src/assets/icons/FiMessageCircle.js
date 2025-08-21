import * as React from "react";
const FiMessageCircle = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={28}
    height={28}
    fill="none"
    viewBox="0 0 28 28"
    {...props}
  >
    <path
      stroke="#2A68D8"
      strokeLinejoin="round"
      strokeWidth={1.92}
      d="M26.472 13.184c0 6.729-5.703 12.184-12.736 12.184a13.257 13.257 0 0 1-2.464-.228c-.585-.11-.877-.165-1.081-.134-.204.032-.493.185-1.072.493a8.278 8.278 0 0 1-5.38.836 6.74 6.74 0 0 0 1.385-2.99c.127-.675-.189-1.331-.661-1.811C2.316 19.354 1 16.417 1 13.184 1 6.455 6.703 1 13.736 1s12.736 5.455 12.736 12.184Z"
    />
    <path
      stroke="#2A68D8"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.92}
      d="M13.663 13.736h.012m5.192 0h.012m-10.42 0h.012"
    />
  </svg>
);


export default FiMessageCircle;
