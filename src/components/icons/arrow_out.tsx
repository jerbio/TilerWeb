import React from 'react';
import Icon from './_icon';

const ArrowOut = ({ size = 21 }: { size?: number }) => {
  return (
    <Icon size={size} defaultSize={21}>
      <svg
        width="21"
        height="21"
        viewBox="0 0 21 21"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_1561_585)">
          <path
            d="M10.0787 4.18639L10.0853 5.34756L15.2483 5.38985L4.00729 16.6308L4.83431 17.4578L16.0753 6.21687L16.1176 11.3798L17.2787 11.3864L17.2208 4.24434L10.0787 4.18639Z"
            fill="currentColor"
          />
        </g>
        <defs>
          <clipPath id="clip0_1561_585">
            <rect
              width="20"
              height="30"
              fill="white"
              transform="translate(0.820801 0.644531)"
            />
          </clipPath>
        </defs>
      </svg>
    </Icon>
  );
};

export default ArrowOut;

