import * as React from "react"
const SvgComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={18}
    fill="none"
    {...props}
  >
    <path
      fill="#CE3B3D"
      stroke="#CE3B3D"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 4.154C8-.54 1-.04 1 5.96s9 11 9 11 9-5 9-11-7-6.5-9-1.806Z"
    />
  </svg>
)
export default SvgComponent
