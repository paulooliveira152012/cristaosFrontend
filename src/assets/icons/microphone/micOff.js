import * as React from "react";

const MicOff = (props) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#clip0_2_6)">
      <path
        d="M23 11H21.3C21.3 11.74 21.14 12.43 20.87 13.05L22.1 14.28C22.66 13.3 23 12.19 23 11ZM18.98 11.17C18.98 11.11 19 11.06 19 11V5C19 3.34 17.66 2 16 2C14.34 2 13 3.34 13 5V5.18L18.98 11.17ZM8.27 3L7 4.27L13.01 10.28V11C13.01 12.66 14.34 14 16 14C16.22 14 16.44 13.97 16.65 13.92L18.31 15.58C17.6 15.91 16.81 16.1 16 16.1C13.24 16.1 10.7 14 10.7 11H9C9 14.41 11.72 17.23 15 17.72V21H17V17.72C17.91 17.59 18.77 17.27 19.54 16.82L23.73 21L25 19.73L8.27 3Z"
        fill="red"
      />
    </g>
    <defs>
      <clipPath id="clip0_2_6">
        <rect width={24} height={24} fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default MicOff;
