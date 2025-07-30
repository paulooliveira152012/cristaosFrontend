import * as React from "react";

const BellIconSolid = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    viewBox="0 0 24 24"
    {...props} // permite usar className ou style com `color`
  >
    <g clipPath="url(#a)">
      <path
        fill="currentColor"
        d="M7.424 21a4.99 4.99 0 0 0 9.152 0H7.424Zm14.968-8.451-1.736-5.723A9.32 9.32 0 0 0 2.58 7.28l-1.348 5.537A5 5 0 0 0 6.09 19h11.517a4.999 4.999 0 0 0 4.785-6.451Z"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h24v24H0z" />
      </clipPath>
    </defs>
  </svg>
);

export default BellIconSolid;
