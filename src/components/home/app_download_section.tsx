import React from 'react';
import Section from '../layout/section';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import ArrowOut from '@/core/common/components/icons/arrow_out';
import apps from '@/core/common/data/apps';

const FlexWrapper = styled.div`
	display: flex;
	justify-content: center;
	gap: 2rem;
`;

const DownloadLink = styled.a`
	display: flex;
	flex-direction: column;
	align-items: center;
	text-decoration: none;
	gap: 0.5rem;

	color: ${palette.colors.gray[500]};
	&:hover {
		color: ${palette.colors.gray[300]};
	}
`;

const DownloadLinkLabel = styled.span`
	display: flex;
	gap: 0.25ch;
	align-items: flex-start;
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	text-align: center;

	transition: color 0.2s ease-in-out;
`;

const AppDownloadSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Section paddingBlock={36}>
      <FlexWrapper>
        {apps.map((app) => (
          <DownloadLink
            key={app.i18Platform}
            href={app.link}
            title={t(app.i18Platform)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <img src={app.icons.logo} alt={t(app.i18CTA)} width={56} height={56} />
            <DownloadLinkLabel>
              <span>{t(app.i18CTA)}</span>
              <ArrowOut size={12} />
            </DownloadLinkLabel>
          </DownloadLink>
        ))}
      </FlexWrapper>
    </Section>
  );
};

export default AppDownloadSection;
