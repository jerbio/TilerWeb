import AppStoreCTA from '@/assets/app_store_cta.svg';
import PlayStoreCTA from '@/assets/play_store_cta.svg';
import AppStore from '@/assets/icons/app_store.svg';
import PlayStore from '@/assets/icons/play_store.svg';

type App = {
  link: string;
  i18CTA: string;
	i18Platform: string;
  icons: {
    logo: string;
    cta: string;
  };
};

const apps: Array<App> = [
  {
    link: 'https://apps.apple.com/us/app/tiler-assistant/id1663594789',
    i18CTA: 'common.apps.ios.cta',
		i18Platform: 'common.apps.ios.platform',
    icons: {
      logo: AppStore,
      cta: AppStoreCTA,
    },
  },
  {
    link: 'https://play.google.com/store/apps/details?id=app.tiler.app',
    i18CTA: 'common.apps.android.cta',
		i18Platform: 'common.apps.android.platform',
    icons: {
      logo: PlayStore,
      cta: PlayStoreCTA,
    },
  },
];

export default apps;
