import InstagramLogo from '@/assets/social/instagram.svg';
import FacebookLogo from '@/assets/social/facebook.svg';
import LinkedInLogo from '@/assets/social/linkedin.svg';
import XLogo from '@/assets/social/x.svg';

type Social = {
  link: string;
  logo: string;
  i18Name: string;
};
const socials: Array<Social> = [
  {
    link: 'https://www.facebook.com/profile.php?id=100094419297775',
    logo: FacebookLogo,
    i18Name: 'common.social.facebook',
  },
  {
    link: 'https://www.linkedin.com/company/tilerapp',
    logo: LinkedInLogo,
    i18Name: 'common.social.linkedin',
  },
  {
    link: 'https://www.instagram.com/tiler.app/',
    logo: InstagramLogo,
    i18Name: 'common.social.instagram',
  },
  { link: 'https://x.com/Tiler_app', logo: XLogo, i18Name: 'common.social.x' },
];

export default socials;
