import styled from 'styled-components';
import styles from '../util/styles';
import Button from './button';

const NavigationWrapper = styled.nav`
    display: flex;
    justify-content: space-around;
    width: 800px;
    height: 60px;
    border-radius: ${styles.borderRadius.xxLarge};
    background: #1A1A1A80;
    border: 1px solid #2A2A2A;
`
const SvgWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`
const NavItems = styled.ul`
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    list-style: none;
    padding: 0;
    margin: 0;
    width: 210px;
    font-size: ${styles.typography.textSm};
    font-family: ${styles.typography.fontFamily};
    cursor: pointer;
`
const ButtonsWrapper = styled.div`
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    width: 210px;
    // border: 1px solid ${styles.colors.border};
`
const Navigation = () => {
    return (
        <NavigationWrapper>
            <SvgWrapper>
                <svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                    <rect x="0.100098" width="40" height="32" fill="url(#pattern0_3_11777)"/>
                    <defs>
                    <pattern id="pattern0_3_11777" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use xlinkHref="#image0_3_11777" transform="matrix(0.0074864 0 0 0.0100769 -1.41349 -1.81108)"/>
                    </pattern>
                    <image id="image0_3_11777" width="512" height="512" xlinkHref="data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAzDv/B/eXcBXOtHceAAAAAElFTkSuQmCC"/>
                    </defs>
                </svg>
            </SvgWrapper>
            <NavItems>
                <li className="nav-item">About Tiler</li>
                <li className="nav-item">Contact</li>
                <li className="nav-item">Download</li>
            </NavItems>
            <ButtonsWrapper>
                <Button primary={true} width="113px">Try Tiler for free</Button>
                <Button width="65px">Sign Up</Button>
            </ButtonsWrapper>
        </NavigationWrapper>
    );
};

export default Navigation;