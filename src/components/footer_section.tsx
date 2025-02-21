import React from 'react';
import styled from 'styled-components';
import styles from '../util/styles';

const FooterContainer = styled.footer`
    display: flex;
    justify-content: space-between;
    padding: 20px;
    background: #1a1a1a80;
    color: ${styles.colors.text};
    // position: absolute;
    // bottom: 0;
    // left: 0;
    // width: 100%;
`;

const FooterColumn = styled.div`
    display: flex;
    flex-direction: column;
    text-align: left;
`;

const FooterRow = styled.div`
    margin-bottom: 10px;
`;

const TilerLogo = styled.img`
    width: 100px;
`;

const FooterLink = styled.a`
    margin-right: 10px;
    text-decoration: none;
    color: ${styles.colors.text};

    &:hover {
        text-decoration: underline;
    }
`;

const FooterSection: React.FC = () => {
    return (
        <FooterContainer>
            <FooterColumn>
                <FooterRow>
                    <TilerLogo src="/path/to/tiler-logo.png" alt="Tiler Logo" />
                </FooterRow>
                <FooterRow>
                    <p>&copy; 2023 Tiler. All rights reserved.</p>
                </FooterRow>
                <FooterRow>
                    <FooterLink href="https://www.facebook.com/tiler" target="_blank" rel="noopener noreferrer">Facebook</FooterLink>
                    <FooterLink href="https://www.linkedin.com/company/tiler" target="_blank" rel="noopener noreferrer">LinkedIn</FooterLink>
                    <FooterLink href="https://www.instagram.com/tiler" target="_blank" rel="noopener noreferrer">Instagram</FooterLink>
                    <FooterLink href="https://www.twitter.com/tiler" target="_blank" rel="noopener noreferrer">X</FooterLink>
                </FooterRow>
            </FooterColumn>
            <FooterColumn>
                <FooterRow>
                    <FooterLink href="/legal">Legal</FooterLink>
                </FooterRow>
                <FooterRow>
                    <FooterLink href="/terms-of-use">Terms of Use</FooterLink>
                </FooterRow>
                <FooterRow>
                    <FooterLink href="/privacy">Privacy</FooterLink>
                </FooterRow>
            </FooterColumn>
        </FooterContainer>
    );
};

export default FooterSection;