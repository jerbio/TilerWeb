import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';

interface PromptSuggestionsProps {
  onPromptClick: (prompt: string) => void;
  chatContext?: string;
}

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 16px 0;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const PromptPill = styled.button`
  background: ${palette.colors.gray[50]};
  border: 1px solid ${palette.colors.gray[200]};
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${palette.colors.gray[800]};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: ${palette.colors.brand[50]};
    border-color: ${palette.colors.brand[300]};
    color: ${palette.colors.brand[700]};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const allPrompts = [
  // ⚙️ Core / Structural
  'Morning setup',
  'Daily planning',
  'Travel buffer',
  'Task review',
  'Day wrap-up',

  // 🧑‍💼 Professional
  'Sales call',
  'Client presentation',
  'Proposal drafting',
  'Contract review',
  'Budget review',
  'Team sync',
  'Board prep',
  'Performance check-in',

  // 📊 Operations / Execution
  'Dispatch schedule',
  'Shift changeover',
  'Inventory check',
  'Quality audit',
  'Field visit',
  'Vendor coordination',
  'Report submission',

  // 📍 Location-Linked
  'Site visit',
  'Office block',
  'On-site inspection',
  'Customer appointment',
  'Pickup / delivery',
  'Route planning',

  // 🚀 Strategic
  'Market research',
  'Competitive scan',
  'Weekly forecast',
  'Hiring interview',
  'Investor call',
  'Product roadmap review',

  // 🧠 Deep Work
  'Writing session',
  'Analysis block',
  'Design sprint',
  'Coding block',
  'Financial modeling',
  'Research study',
];

// Utility function to get random prompts
const getRandomPrompts = (count: number = 5): string[] => {
  const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onPromptClick }) => {
  const [displayedPrompts] = React.useState(() => getRandomPrompts(5));

  return (
    <Container>
      {displayedPrompts.map((prompt, index) => (
        <PromptPill key={index} onClick={() => onPromptClick(prompt)}>
          {prompt}
        </PromptPill>
      ))}
    </Container>
  );
};

export default PromptSuggestions;
