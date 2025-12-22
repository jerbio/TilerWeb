import React from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import { useTranslation } from 'react-i18next';

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

// Utility function to get random prompts
const getRandomPrompts = (count: number = 5, allPrompts: string[]): string[] => {
  const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onPromptClick }) => {
  const { t } = useTranslation();

  // Build the prompts array using translations
  const allPrompts = [
    // ⚙️ Core / Structural
    t('home.expanded.chat.promptSuggestions.coreStructural.morningSetup'),
    t('home.expanded.chat.promptSuggestions.coreStructural.dailyPlanning'),
    t('home.expanded.chat.promptSuggestions.coreStructural.travelBuffer'),
    t('home.expanded.chat.promptSuggestions.coreStructural.taskReview'),
    t('home.expanded.chat.promptSuggestions.coreStructural.dayWrapUp'),

    // 🧑‍💼 Professional
    t('home.expanded.chat.promptSuggestions.professional.salesCall'),
    t('home.expanded.chat.promptSuggestions.professional.clientPresentation'),
    t('home.expanded.chat.promptSuggestions.professional.proposalDrafting'),
    t('home.expanded.chat.promptSuggestions.professional.contractReview'),
    t('home.expanded.chat.promptSuggestions.professional.budgetReview'),
    t('home.expanded.chat.promptSuggestions.professional.teamSync'),
    t('home.expanded.chat.promptSuggestions.professional.boardPrep'),
    t('home.expanded.chat.promptSuggestions.professional.performanceCheckIn'),

    // 📊 Operations / Execution
    t('home.expanded.chat.promptSuggestions.operations.dispatchSchedule'),
    t('home.expanded.chat.promptSuggestions.operations.shiftChangeover'),
    t('home.expanded.chat.promptSuggestions.operations.inventoryCheck'),
    t('home.expanded.chat.promptSuggestions.operations.qualityAudit'),
    t('home.expanded.chat.promptSuggestions.operations.fieldVisit'),
    t('home.expanded.chat.promptSuggestions.operations.vendorCoordination'),
    t('home.expanded.chat.promptSuggestions.operations.reportSubmission'),

    // 📍 Location-Linked
    t('home.expanded.chat.promptSuggestions.locationLinked.siteVisit'),
    t('home.expanded.chat.promptSuggestions.locationLinked.officeBlock'),
    t('home.expanded.chat.promptSuggestions.locationLinked.onSiteInspection'),
    t('home.expanded.chat.promptSuggestions.locationLinked.customerAppointment'),
    t('home.expanded.chat.promptSuggestions.locationLinked.pickupDelivery'),
    t('home.expanded.chat.promptSuggestions.locationLinked.routePlanning'),

    // 🚀 Strategic
    t('home.expanded.chat.promptSuggestions.strategic.marketResearch'),
    t('home.expanded.chat.promptSuggestions.strategic.competitiveScan'),
    t('home.expanded.chat.promptSuggestions.strategic.weeklyForecast'),
    t('home.expanded.chat.promptSuggestions.strategic.hiringInterview'),
    t('home.expanded.chat.promptSuggestions.strategic.investorCall'),
    t('home.expanded.chat.promptSuggestions.strategic.productRoadmapReview'),

    // 🧠 Deep Work
    t('home.expanded.chat.promptSuggestions.deepWork.writingSession'),
    t('home.expanded.chat.promptSuggestions.deepWork.analysisBlock'),
    t('home.expanded.chat.promptSuggestions.deepWork.designSprint'),
    t('home.expanded.chat.promptSuggestions.deepWork.codingBlock'),
    t('home.expanded.chat.promptSuggestions.deepWork.financialModeling'),
    t('home.expanded.chat.promptSuggestions.deepWork.researchStudy'),
  ];

  const [displayedPrompts] = React.useState(() => getRandomPrompts(5, allPrompts));

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
