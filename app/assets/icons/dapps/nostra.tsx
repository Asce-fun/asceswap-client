import React from "react";

const Nostra = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 38 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 26.8643L14.9051 18.3306L0 9.79681V26.8643ZM18.6163 20.4536L0 31.115L18.6163 41.7719L37.2325 31.115V9.79681L18.6163 20.4582V20.4536ZM18.3794 6.15857L9.84229 11.1876L18.6163 16.2121L27.3856 11.1876L18.384 6.16317L18.3794 6.15857Z"
        fill="#FF4240"
      />
    </svg>
  );
};

export default Nostra;
