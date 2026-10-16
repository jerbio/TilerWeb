import styled from 'styled-components';
import { MarkdownRenderer } from '@/core/common/components/chat/MarkdownRenderer';

/** Render the Markdown string shared by web and mobile without interpreting raw HTML. */
export default function TileShareNote({ content }: { content: string }) {
	return (
		<Note>
			<MarkdownRenderer content={content} />
		</Note>
	);
}

const Note = styled.div`
	font-size: 15px;
	line-height: 1.75;
	color: ${({ theme }) => theme.colors.text.primary};
	p:last-child {
		margin-bottom: 0;
	}
	min-width: 0;
	overflow-wrap: anywhere;
	ul {
		list-style: disc;
	}
	ol {
		list-style: decimal;
	}
	img {
		max-width: 100%;
		height: auto;
	}
	pre {
		max-width: 100%;
	}
`;
