import * as React from "react"
const SvgComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={27}
    height={27}
    fill="none"
    {...props}
  >
    <path
      fill="#2A68D8"
      fillRule="evenodd"
      d="M12.832 1.676a1.094 1.094 0 0 1 1.343 0l9.848 7.66c.266.207.422.525.422.863v12.036a3.282 3.282 0 0 1-3.282 3.282H5.845a3.282 3.282 0 0 1-3.283-3.282V10.199c0-.338.156-.656.423-.864l9.847-7.659Zm-8.081 9.058v11.5a1.094 1.094 0 0 0 1.094 1.095h15.318a1.094 1.094 0 0 0 1.094-1.094v-11.5l-8.753-6.809-8.753 6.808Z"
      clipRule="evenodd"
    />
    <path
      fill="#2A68D8"
      fillRule="evenodd"
      d="M9.127 13.481c0-.604.49-1.094 1.094-1.094h6.565c.604 0 1.094.49 1.094 1.094v10.942a1.094 1.094 0 0 1-2.188 0v-9.847h-4.377v9.847a1.094 1.094 0 0 1-2.188 0V13.48Z"
      clipRule="evenodd"
    />
  </svg>
)
export default SvgComponent
