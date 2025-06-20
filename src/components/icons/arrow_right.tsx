import React from 'react';
import Icon from './_icon';

const ArrowRight = ({ size = 19 }: { size?: number }) => {
  return (
    <Icon size={size} defaultSize={19}>
      <svg
        width="19"
        height="10"
        viewBox="0 0 19 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13.4696 0L12.6678 0.810935L16.2238 4.42568H0.611328V5.57432H16.2238L12.6678 9.18906L13.4696 10L18.3891 5L13.4696 0Z"
          fill="currentColor"
        />
      </svg>
    </Icon>
  );
};

export default ArrowRight;
