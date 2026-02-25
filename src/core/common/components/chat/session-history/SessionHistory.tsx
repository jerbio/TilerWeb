import React, { useEffect, useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { chatService } from '@/services';
import { VibeSession } from '@/core/common/types/chat';
import analytics from '@/core/util/analytics';
import TimeUtil from '@/core/util/time';

const BATCH_SIZE = 20;

type SessionHistoryProps = {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId: string;
  onSessionSelect: (session: VibeSession) => void;
  onNewChat: () => void;
  userId?: string;
};

const SessionHistory: React.FC<SessionHistoryProps> = ({
  isOpen,
  onClose,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  userId,
}) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<VibeSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(async (index: number, append: boolean = false) => {
    if (!userId) return;

    const isFirstLoad = index === 0 && !append;
    if (isFirstLoad) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const response = await chatService.getVibeSessions(undefined, userId, {
        batchSize: BATCH_SIZE,
        index,
        order: 'desc',
      });

      const fetched = response.Content.vibeSessions || [];

      if (append) {
        setSessions((prev) => [...prev, ...fetched]);
      } else {
        setSessions(fetched);
      }

      setHasMore(fetched.length === BATCH_SIZE);
      setPageIndex(index);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [userId]);

  // Fetch on open
  useEffect(() => {
    if (isOpen && userId) {
      fetchSessions(0);
    }
  }, [isOpen, userId, fetchSessions]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchSessions(pageIndex + 1, true);
    }
  };

  const handleSessionClick = (session: VibeSession) => {
    analytics.trackChatEvent('Session History - Session Selected', {
      sessionId: session.id,
      sessionTitle: session.title || 'Untitled',
    });
    onSessionSelect(session);
    onClose();
  };

  const handleNewChatClick = () => {
    analytics.trackChatEvent('Session History - New Chat', {});
    onNewChat();
    onClose();
  };

  const formatTimestamp = (ms: number): string => TimeUtil.relativeTime(ms);

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <PanelHeader>
          <h2>{t('home.expanded.chat.sessionHistory.title')}</h2>
          <CloseButton onClick={onClose}>
            <X size={18} />
          </CloseButton>
        </PanelHeader>

        <NewChatButton onClick={handleNewChatClick}>
          <MessageSquare size={16} />
          <span>{t('home.expanded.chat.newChat')}</span>
        </NewChatButton>

        <SessionList ref={listRef}>
          {isLoading ? (
            <LoadingState>
              <Loader2 size={20} className="spin" />
              <span>{t('home.expanded.chat.sessionHistory.loading')}</span>
            </LoadingState>
          ) : sessions.length === 0 ? (
            <EmptyState>
              <span>{t('home.expanded.chat.sessionHistory.empty')}</span>
            </EmptyState>
          ) : (
            <>
              {sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  $isActive={session.id === currentSessionId}
                  onClick={() => handleSessionClick(session)}
                >
                  <SessionTitle>
                    {session.title || t('home.expanded.chat.sessionHistory.untitled')}
                  </SessionTitle>
                  <SessionTimestamp>
                    {formatTimestamp(session.creationTimeInMs)}
                  </SessionTimestamp>
                </SessionItem>
              ))}

              {hasMore && (
                <LoadMoreButton onClick={handleLoadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? (
                    <>
                      <Loader2 size={14} className="spin" />
                      <span>{t('home.expanded.chat.sessionHistory.loadingMore')}</span>
                    </>
                  ) : (
                    <span>{t('home.expanded.chat.sessionHistory.loadMore')}</span>
                  )}
                </LoadMoreButton>
              )}
            </>
          )}
        </SessionList>
      </Panel>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 50;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  animation: fadeIn 0.15s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Panel = styled.div`
  position: absolute;
  inset: 0;
  background-color: ${({ theme }) => theme.colors.background.page};
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease-out;

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};

  h2 {
    font-size: ${({ theme }) => theme.typography.fontSize.base};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    color: ${({ theme }) => theme.colors.text.primary};
    font-family: ${({ theme }) => theme.typography.fontFamily.urban};
    margin: 0;
  }
`;

const CloseButton = styled.button`
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.button.ghost.bg};
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.button.ghost.bgHover};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const NewChatButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background-color: ${({ theme }) => theme.colors.button.brand.bg};
  color: ${({ theme }) => theme.colors.button.brand.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-family: ${({ theme }) => theme.typography.fontFamily.inter};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.button.brand.bgHover};
  }
`;

const SessionList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem 0.75rem;

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const SessionItem = styled.button<{ $isActive: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.625rem 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.background.card2 : 'transparent'};
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease;
  border-left: 2px solid ${({ $isActive, theme }) =>
    $isActive ? theme.colors.brand[500] : 'transparent'};

  &:hover {
    background-color: ${({ theme }) => theme.colors.button.ghost.bgHover};
  }

  & + & {
    margin-top: 2px;
  }
`;

const SessionTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.typography.fontFamily.inter};
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
`;

const SessionTimestamp = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.typography.fontFamily.inter};
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const LoadMoreButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem;
  margin-top: 0.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: ${({ theme }) => theme.typography.fontFamily.inter};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.button.ghost.bgHover};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  &:disabled {
    cursor: default;
  }
`;

export default SessionHistory;
