import * as React from "react";
const FiMessageCircle = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={42}
    height={43}
    fill="none"
    viewBox="0 0 35 36"
    {...props}
  >
    <circle cx={17.5} cy={18.25} r={17.5} fill="#2A68D8" />
    <path
      stroke="#fff"
      strokeLinejoin="round"
      strokeWidth={1.323}
      d="M26.548 18.569c0 4.732-3.929 8.568-8.774 8.568a8.942 8.942 0 0 1-1.697-.16c-.403-.077-.605-.116-.745-.094-.14.022-.34.13-.739.347a5.6 5.6 0 0 1-3.706.588 4.8 4.8 0 0 0 .954-2.104c.088-.474-.13-.935-.455-1.273A8.429 8.429 0 0 1 9 18.57C9 13.837 12.929 10 17.774 10c4.845 0 8.774 3.837 8.774 8.569Z"
    />
    <path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.323}
      d="M17.724 18.957h.008m3.577 0h.008m-7.179 0h.008"
    />
  </svg>
);
export default FiMessageCircle;
