import React from "react";

const Vesu = ({ size = 16 }: { size?: number }) => {
  return (
    <img
      src="https://vesu.xyz/img/vesu-logo-light-mobile.png"
      alt="Vesu"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
};

export default Vesu;
