import Section from '../layout/section';
import styled from 'styled-components';
import styles from '../../util/styles';
import AppStore from '../../assets/image_assets/icons/app_store.svg';
import PlayStore from '../../assets/image_assets/icons/play_store.svg';
import ArrowOut from '../icons/arrow_out';
import { useTranslation } from 'react-i18next';

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

  color: ${styles.colors.gray[500]};
  &:hover {
    color: ${styles.colors.gray[300]};
  }
`;

const DownloadLinkLabel = styled.span`
  display: flex;
  gap: 0.25ch;
  align-items: flex-start;
  font-size: ${styles.typography.fontSize.sm};
  font-weight: ${styles.typography.fontWeight.normal};

  transition: color 0.2s ease-in-out;
`;

const AppDownloadSection = () => {
	const { t } = useTranslation();
	
	return (
		<Section paddingBlock={36}>
			<FlexWrapper>
				<DownloadLink
          href="https://apps.apple.com/us/app/tiler-assistant/id1663594789"
					title={t('home.appDownload.ios.title')}
          rel="noopener noreferrer"
          target="_blank"
				>
					<img
						src={AppStore}
						alt={t('home.appDownload.ios.alt')}
            width={56}
            height={56}
					/>
					<DownloadLinkLabel>
						<span>{t('home.appDownload.ios.title')}</span>
            <ArrowOut />
					</DownloadLinkLabel>
				</DownloadLink>
				<DownloadLink
					href="https://play.google.com/store/apps/details?id=app.tiler.app"
					title={t('home.appDownload.android.title')}
          rel="noopener noreferrer"
          target="_blank"
				>
					<img
						src={PlayStore}
						alt={t('home.appDownload.android.alt')}
            width={56}
            height={56}
					/>
					<DownloadLinkLabel>
						<span>{t('home.appDownload.android.title')}</span>
            <ArrowOut />
					</DownloadLinkLabel>
				</DownloadLink>
			</FlexWrapper>
		</Section>
	);
};

export default AppDownloadSection;

