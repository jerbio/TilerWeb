import React from 'react';
import ChatUtil from '@/core/util/chat';
import { VibeAction } from '@/core/common/types/chat';

interface ActionIconProps {
  action: VibeAction;
}

const ActionIcon: React.FC<ActionIconProps> = ({ action }) => {
  const iconData = ChatUtil.getActionIcon(action);
  const isEmoji = iconData.type === 'emoji';

  if (isEmoji) {
    return (
      <span
        style={{
          fontSize: '15px',
          verticalAlign: 'middle',
        }}
      >
        {iconData.value}
      </span>
    );
  }

  return (
    <img
      src={iconData.value}
      alt="action_icon"
      style={{
        width: '15px',
        height: '15px',
        verticalAlign: 'middle',
      }}
    />
  );
};

export default ActionIcon;