import * as React from "react";
const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={19}
    height={18}
    fill="none"
    viewBox="0 0 19 18"
    {...props}
  >
    <path fill="#fff" d="M1 1h17v16H1z" />
    <path
      fill="#484C52"
      d="m2 5-.456-.456L1.088 5l.456.456L2 5Zm15.355 2a.645.645 0 0 0 1.29 0h-1.29ZM6 1 5.544.544l-4 4L2 5l.456.456 4-4L6 1ZM2 5l-.456.456 4 4L6 9l.456-.456-4-4L2 5Zm0 0v.645h14v-1.29H2V5Zm14 0v.645c.748 0 1.355.607 1.355 1.355h1.29A2.645 2.645 0 0 0 16 4.355V5Zm2 8 .456-.456.456.456-.456.456L18 13ZM3 13v.645V13ZM.355 11a.645.645 0 0 1 1.29 0H.355ZM14 9l.456-.456 4 4L18 13l-.456.456-4-4L14 9Zm4 4 .456.456-4 4L14 17l-.456-.456 4-4L18 13Zm0 0v.645H3v-1.29h15V13ZM3 13v.645A2.645 2.645 0 0 1 .355 11h1.29c0 .748.607 1.355 1.355 1.355V13Z"
    />
  </svg>
);
export default SVGComponent;
