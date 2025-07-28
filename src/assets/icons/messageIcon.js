import * as React from "react";

const SVGComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={25}
    height={24}
    fill="none"
    viewBox="0 0 25 24"
    {...props} // permite aplicar cor via classe/style
  >
    <path
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={1.777}
      d="M23.558 11.523c0 5.812-4.926 10.524-11 10.524a11.445 11.445 0 0 1-2.128-.197c-.505-.095-.758-.142-.934-.116-.176.027-.426.16-.926.426a7.15 7.15 0 0 1-4.646.722A5.822 5.822 0 0 0 5.119 20.3c.11-.583-.162-1.149-.57-1.564-1.855-1.882-2.991-4.42-2.991-7.212C1.558 5.712 6.483 1 12.558 1c6.074 0 11 4.712 11 10.523Z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.777}
      d="M12.495 12h.01m4.485 0H17m-9 0h.01"
    />
  </svg>
);

export default SVGComponent;
