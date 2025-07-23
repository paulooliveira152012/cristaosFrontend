import * as React from "react"
const SvgComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={49}
    height={49}
    fill="none"
    {...props}
  >
    <path
      stroke="#2A68D8"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3.063}
      d="M24.5 31.646a8.164 8.164 0 0 0 8.167-8.167V12.25A8.164 8.164 0 0 0 24.5 4.084a8.164 8.164 0 0 0-8.166 8.167v11.23a8.164 8.164 0 0 0 8.166 8.166Z"
    />
    <path
      stroke="#2A68D8"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3.063}
      d="M8.881 19.702v3.47c0 8.617 7.003 15.62 15.62 15.62 8.615 0 15.618-7.003 15.618-15.62v-3.47m-18.457-6.574a8.222 8.222 0 0 1 5.676 0m-4.471 4.328a6.408 6.408 0 0 1 3.287 0M24.5 38.792v6.125"
    />
  </svg>
)
export default SvgComponent
