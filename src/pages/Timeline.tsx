import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import palette from '@/core/theme/palette';
import Logo from '@/core/common/components/icons/logo';
import Spinner from '@/core/common/components/loader';
import useAppStore from '@/global_state';

const Timeline: React.FC = () => {
  const authenticatedUser = useAppStore((state) => state.authenticatedUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // User is already authenticated and available from global state
    if (authenticatedUser) {
      setIsLoading(false);
    }
  }, [authenticatedUser]);

  if (isLoading || !authenticatedUser) {
    return (
      <Container>
        <LoadingContainer>
          <Spinner />
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Logo size={48} />
        <Title>Timeline</Title>
      </Header>

      <Content>
        <UserCard>
          <CardHeader>Signed In User</CardHeader>

          <UserInfo>
            <InfoRow>
              <Label>Full Name:</Label>
              <Value>{authenticatedUser.fullName || 'N/A'}</Value>
            </InfoRow>

            <InfoRow>
              <Label>Username:</Label>
              <Value>{authenticatedUser.username}</Value>
            </InfoRow>

            <InfoRow>
              <Label>Email:</Label>
              <Value>{authenticatedUser.email || 'N/A'}</Value>
            </InfoRow>

            <InfoRow>
              <Label>Phone:</Label>
              <Value>{authenticatedUser.phoneNumber || 'N/A'}</Value>
            </InfoRow>

            <InfoRow>
              <Label>Time Zone:</Label>
              <Value>{authenticatedUser.timeZone}</Value>
            </InfoRow>

            <InfoRow>
              <Label>User ID:</Label>
              <Value>{authenticatedUser.id}</Value>
            </InfoRow>
          </UserInfo>
        </UserCard>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background-color: ${palette.colors.black};
  padding: 2rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: ${palette.typography.fontSize.displaySm};
  color: ${palette.colors.white};
  font-family: ${palette.typography.fontFamily.urban};
  font-weight: ${palette.typography.fontWeight.bold};
  margin: 0;
`;

const Content = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const UserCard = styled.div`
  background-color: ${palette.colors.gray[900]};
  border: 1px solid ${palette.colors.gray[800]};
  border-radius: ${palette.borderRadius.large};
  padding: 2rem;
`;

const CardHeader = styled.h2`
  font-size: ${palette.typography.fontSize.xl};
  color: ${palette.colors.white};
  font-weight: ${palette.typography.fontWeight.semibold};
  margin: 0 0 1.5rem 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${palette.colors.gray[800]};
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
`;

const Label = styled.span`
  color: ${palette.colors.gray[400]};
  font-size: ${palette.typography.fontSize.sm};
  font-weight: ${palette.typography.fontWeight.medium};
`;

const Value = styled.span`
  color: ${palette.colors.white};
  font-size: ${palette.typography.fontSize.base};
  word-break: break-all;
`;

export default Timeline;
