import React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Menu, X } from 'lucide-react';
import { a } from '@react-spring/web';
import { useTranslation } from 'react-i18next';
import palette from '@/core/theme/palette';
import Button from '@/core/common/components/button';
import Logo from '@/core/common/components/icons/logo';
import CustomPersonaModal from './navigation/CustomPersonaModal';
import { PersonaApi } from '@/api/personaApi';
import analytics from '@/core/util/analytics';

const NavigationContainerSticky = styled.div`
	display: flex;
	justify-content: center;
	position: sticky;
	top: 0px;
	z-index: 999;
`;

const NavigationContainer = styled.div`
	width: 100%;
	height: 100px;
	position: relative;
	isolation: isolate;
`;

const NavigationWrapper = styled(a.nav) <{ $isopen: boolean; $shrink: boolean }>`
	display: grid;
	place-items: center;
	padding: 0 1.5rem;
	backdrop-filter: ${(props) => (!props.$isopen ? 'blur(16px)' : 'none')};
	border-radius: ${palette.borderRadius.xxLarge};

	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: calc(100% - 64px);

	border: ${(props) =>
    props.$shrink && !props.$isopen
      ? `1px solid ${palette.colors.gray[800]}`
      : '1px solid transparent'};
	background-color: ${(props) =>
    props.$shrink && !props.$isopen ? palette.colors.glass : 'transparent'};
	border-radius: ${(props) => (props.$shrink ? palette.borderRadius.xxLarge : 0)};
	height: ${(props) => (props.$shrink ? '60px' : '80px')};
	max-width: ${(props) => (props.$shrink ? '800px' : '100%')};

	transition: ${(props) =>
    `
		background-color ${props.$shrink ? '0.5s' : '0s'} cubic-bezier(0.4, 0, 0.2, 1),
		border ${props.$shrink ? '0.5s' : '0s'} cubic-bezier(0.4, 0, 0.2, 1),
		height 0.5s cubic-bezier(0.4, 0, 0.2, 1),
		max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1)
	`};
`;

const NavigationItemsWrapper = styled.div`
	width: 100%;
	max-width: ${palette.screens.lg};

	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const NavItems = styled.ul`
	display: flex;
	gap: 1.5rem;
	align-items: center;

	@media (max-width: 768px) {
		display: none;
	}
`;

const NavItem = styled.li``;

const NavLink = styled.a`
	color: ${palette.colors.gray[500]};
	text-decoration: none;
	line-height: 1.3;
	font-size: ${palette.typography.fontSize.sm};
	font-weight: ${palette.typography.fontWeight.medium};
	font-family: ${palette.typography.fontFamily.inter};
	cursor: pointer;
	&:hover {
		color: ${palette.colors.gray[400]};
	}
`;

const ButtonsWrapper = styled.div`
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	gap: 1rem;

	@media (max-width: 768px) {
		display: none;
	}
`;

const MobileMenuToggle = styled.div`
	display: none;
	cursor: pointer;

	@media (max-width: 768px) {
		display: block;
	}
`;

const MobileNav = styled.div<{ $isopen: boolean; $shrink: boolean }>`
	display: flex;
	flex-direction: column;
	backdrop-filter: blur(16px);
	opacity: ${(props) => (props.$isopen ? 1 : 0)};
	background-color: ${(props) =>
    props.$shrink && props.$isopen ? palette.colors.glass : '#000000'};
	border: ${(props) =>
    props.$shrink && props.$isopen
      ? `1px solid ${palette.colors.gray[800]}`
      : '0px solid transparent'};
	border-radius: ${(props) => (props.$shrink ? `${palette.borderRadius.xxLarge}` : 0)};

	position: absolute;
	top: 50%;
	left: 50%;
	transform: translateX(calc(-50%)) translateY(-31px);
	z-index: -1;
	width: calc(100% - 62px);

	padding: ${({ $isopen: isOpen }) => (isOpen ? '56px 16px 16px' : '0 16px')};
	max-height: ${({ $isopen: isOpen }) => (isOpen ? '500px' : '60px')};
	overflow: hidden;
	transition: all 0.35s linear;

	hr {
		border-top: 1px solid
			${(props) => (props.$shrink ? palette.colors.gray[700] : palette.colors.gray[900])};
		margin: 0.5rem 0 1rem;
		transition: border-top 0.35s ease-in-out;
	}

	@media (min-width: 769px) {
		display: none;
	}
`;

const MobileNavLinks = styled.div<{ $shrink: boolean }>`
	display: flex;
	flex-direction: column;

	a {
		text-align: center;
		padding: 0.75rem 0;
		color: ${(props) => (props.$shrink ? palette.colors.gray[400] : palette.colors.gray[500])};
		font-size: 13px;
		font-weight: ${palette.typography.fontWeight.medium};
		&:hover {
			color: ${palette.colors.gray[300]};
		}
	}
`;

const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navLinks = [
    { name: t('common.navigation.home'), href: '/' },
    { name: t('common.navigation.features'), href: '/features' },
  ];

  function handleScroll() {
    if (window.scrollY === 0) {
      setIsAtTop(true);
    } else {
      setIsAtTop(false);
    }
  }
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  function handleTryFreeClick() {
    analytics.trackButtonClick('Try Free', 'Navigation', {
      isModalOpen: isModalOpen,
      isOnHomePage: window.location.pathname === '/',
    });

    setIsModalOpen(true);
    setIsOpen(false); // Close mobile menu if open
    
    // If on home page, dispatch event to focus on custom persona in carousel
    if (window.location.pathname === '/') {
      window.dispatchEvent(new CustomEvent('focusCustomPersona'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleModalClose() {
    analytics.trackEvent('Modal', 'Close', 'Custom Persona Modal', undefined, {
      location: 'Navigation',
    });
    
    setIsModalOpen(false);
    
    // Dispatch event to re-enable carousel
    if (window.location.pathname === '/') {
      window.dispatchEvent(new CustomEvent('customPersonaModalDismissed'));
    }
  }

  async function handleModalSubmit(description: string, audioFile?: Blob) {
    // Keep modal open with spinner while API processes
    // The modal's isSubmitting state will show the spinner
    
    analytics.trackEvent('Modal', 'Submit', 'Custom Persona Modal', undefined, {
      hasAudio: !!audioFile,
      descriptionLength: description.length,
      location: 'Navigation',
    });
    
    // If there's an audio file or description, send it to the backend
    try {
      const personaApi = new PersonaApi();
      const response = await personaApi.createPersonaWithAudio(description, audioFile);
      const finalDescription = response?.Content?.anonymousUserWithPersona?.userDescription || description || 'Custom';
      const anonymousUser = response?.Content?.anonymousUserWithPersona?.anonymousUser;
      
      // Close modal after API completes successfully
      setIsModalOpen(false);
      
      // Don't dispatch dismiss event on submit - persona will be selected/expanded
      
      // Navigate to home page with the persona
      const params = new URLSearchParams();
      params.set('customPersona', 'true');
      params.set('description', finalDescription);
      
      if (window.location.pathname === '/') {
        // Already on home page, dispatch event with complete persona data and user info
        window.dispatchEvent(
          new CustomEvent('createCustomPersona', { 
            detail: { 
              persona: {
                id: 'custom-persona',
                name: finalDescription,
                description: finalDescription,
              },
              anonymousUser: anonymousUser,  // Include user data from API
            } 
          })
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Navigate to home page
        window.location.href = `/?${params.toString()}`;
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      // Close modal on error too
      setIsModalOpen(false);
      // TODO: Show error message to user in toast
    }
  }

  return (
    <NavigationContainerSticky>
      <NavigationContainer>
        <NavigationWrapper $isopen={isOpen} $shrink={!isAtTop}>
          <NavigationItemsWrapper>
            <Logo size={32} />
            <NavItems>
              {navLinks.map((link) => (
                <NavItem key={link.name}>
                  <NavLink 
                    href={link.href}
                    onClick={() => {
                      analytics.trackNavigation(link.href, 'Desktop Navigation', {
                        linkName: link.name,
                      });
                    }}
                  >
                    {link.name}
                  </NavLink>
                </NavItem>
              ))}
            </NavItems>
            <ButtonsWrapper>
              <Button
                size="small"
                onClick={handleTryFreeClick}
                bordergradient={[palette.colors.brand[400]]}
              >
                {t('common.buttons.tryFree')}
              </Button>
            </ButtonsWrapper>
            <MobileMenuToggle onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? (
                <X size={24} color={palette.colors.gray[300]} />
              ) : (
                <Menu size={24} color={palette.colors.gray[300]} />
              )}
            </MobileMenuToggle>
          </NavigationItemsWrapper>
        </NavigationWrapper>
        <MobileNav $isopen={isOpen} $shrink={!isAtTop}>
          <MobileNavLinks $shrink={!isAtTop}>
            {navLinks.map((link) => (
              <NavLink 
                key={link.name} 
                href={link.href}
                onClick={() => {
                  analytics.trackNavigation(link.href, 'Mobile Navigation', {
                    linkName: link.name,
                  });
                  setIsOpen(false);
                }}
              >
                {link.name}
              </NavLink>
            ))}
          </MobileNavLinks>
          <hr />
          <Button
            height={40}
            onClick={handleTryFreeClick}
            bordergradient={[palette.colors.brand[500]]}
            size="small"
          >
            {t('common.buttons.tryFree')}
          </Button>
          <div style={{ height: '12px' }} />
          <Button
            height={40}
            variant="secondary"
            onClick={() => {
              analytics.trackButtonClick('Sign Up', 'Mobile Navigation', {
                destination: 'https://tiler.app/?waitlistSignUp=true',
              });
              window.open('https://tiler.app/?waitlistSignUp=true', '_blank');
            }}
            size="small"
          >
            {t('common.buttons.signUp')}
          </Button>
        </MobileNav>
      </NavigationContainer>
      <CustomPersonaModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    </NavigationContainerSticky>
  );
};

export default Navigation;
