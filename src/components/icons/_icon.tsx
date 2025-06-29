import React from 'react';

type IconProps = {
  size: number;
  defaultSize: number;
  children: React.ReactNode;
};

const Icon = ({ size, defaultSize, children }: IconProps) => {
  const iconSize = size;
  const SCALE = iconSize / defaultSize;

  return (
    <div style={{
      width: iconSize,
      height: iconSize,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <span style={{
        transform: `scale(${SCALE})`,
        transformOrigin: 'center',
        position: 'absolute',
        top: '50%',
        left: '50%',
        translate: '-50% -50%',
      }}>
        {children}
      </span>
    </div>
  )
}

export default Icon;