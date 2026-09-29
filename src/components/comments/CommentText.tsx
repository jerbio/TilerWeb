import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { CommentPerson } from '@/core/common/types/comment';
import { mentionSegments } from './mentions';

type CommentTextProps = {
	text: string;
	mentions?: CommentPerson[];
};

/** Renders comment text as plain text nodes with highlighted mentions; never as HTML. */
const CommentText: React.FC<CommentTextProps> = ({ text, mentions }) => {
	const { t } = useTranslation();
	return (
		<>
			{mentionSegments(text, mentions).map((segment, i) =>
				segment.type === 'text' ? (
					<React.Fragment key={i}>{segment.value}</React.Fragment>
				) : (
					<Mention key={i} data-testid="comment-mention" $deleted={!segment.name}>
						@{segment.name ?? t('comments.deletedAuthor')}
					</Mention>
				)
			)}
		</>
	);
};

const Mention = styled.span<{ $deleted: boolean }>`
	font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
	color: ${({ theme, $deleted }) =>
		$deleted ? theme.colors.text.muted : theme.colors.teal[300]};
`;

export default CommentText;
