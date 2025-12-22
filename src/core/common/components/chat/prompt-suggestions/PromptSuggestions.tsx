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
  gap: 6px;
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
  border-radius: 16px;
  padding: 8px 12px;
  font-size: 13px;
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
  'Set up my morning routine',
  'Plan my day',
  'Add travel buffer time',
  'Review my tasks',
  'Wrap up my day',

  // 🧑‍💼 Professional
  'Schedule a sales call',
  'Prepare client presentation',
  'Draft a proposal',
  'Review contract',
  'Analyze budget',
  'Sync with team',
  'Prepare for board meeting',
  'Conduct performance check-in',

  // 📊 Operations / Execution
  'Create dispatch schedule',
  'Plan shift changeover',
  'Check inventory',
  'Conduct quality audit',
  'Schedule field visit',
  'Coordinate with vendor',
  'Submit report',

  // 📍 Location-Linked
  'Schedule site visit',
  'Block office time',
  'Plan on-site inspection',
  'Book customer appointment',
  'Arrange pickup and delivery',
  'Plan my route',

  // 🚀 Strategic
  'Conduct market research',
  'Analyze competitors',
  'Create weekly forecast',
  'Schedule hiring interview',
  'Prepare investor call',
  'Review product roadmap',

  // 🧠 Deep Work
  'Block time for writing',
  'Schedule analysis time',
  'Plan design sprint',
  'Block coding time',
  'Build financial model',
  'Conduct research study',
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
        <PromptPill key={index} onClick={() => onPromptClick(prompt)} title={prompt}>
          {prompt}
        </PromptPill>
      ))}
    </Container>
  );
};

export default PromptSuggestions;
