import * as React from "react";

const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    viewBox="0 0 24 24"
    {...props} // permite sobrescrever cor via className/style
  >
    <g clipPath="url(#a)">
      <path
        fill="currentColor"
        d="m22.555 13.662-1.9-6.836a9.321 9.321 0 0 0-18.08.474l-1.47 6.615A5 5 0 0 0 5.984 20H7.1a5 5 0 0 0 9.8 0h.838a5 5 0 0 0 4.819-6.338h-.002ZM11.999 22a2.999 2.999 0 0 1-2.816-2h5.633a3 3 0 0 1-2.817 2Zm8.126-5.185A2.977 2.977 0 0 1 17.736 18H5.986a2.999 2.999 0 0 1-2.929-3.651l1.47-6.616a7.321 7.321 0 0 1 14.2-.372l1.9 6.836a2.978 2.978 0 0 1-.502 2.618Z"
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
