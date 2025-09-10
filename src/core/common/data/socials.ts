import InstagramLogo from '@/assets/social/instagram.svg';
import FacebookLogo from '@/assets/social/facebook.svg';
import LinkedInLogo from '@/assets/social/linkedin.svg';
import XLogo from '@/assets/social/x.svg';
import InstagramButton from '@/assets/social/instagram_button.svg';
import FacebookButton from '@/assets/social/facebook_button.svg';
import LinkedInButton from '@/assets/social/linkedin_button.svg';
import XButton from '@/assets/social/x_button.svg';

type Social = {
  link: string;
  logo: string;
  button: string;
  i18Name: string;
};
const socials: Array<Social> = [
  {
    link: 'https://www.facebook.com/profile.php?id=100094419297775',
    logo: FacebookLogo,
    button: FacebookButton,
    i18Name: 'common.social.facebook',
  },
  {
    link: 'https://www.linkedin.com/company/tilerapp',
    logo: LinkedInLogo,
    button: LinkedInButton,
    i18Name: 'common.social.linkedin',
  },
  {
    link: 'https://www.instagram.com/tiler.app/',
    logo: InstagramLogo,
    button: InstagramButton,
    i18Name: 'common.social.instagram',
  },
  { link: 'https://x.com/Tiler_app', logo: XLogo, button: XButton, i18Name: 'common.social.x' },
];

export default socials;
