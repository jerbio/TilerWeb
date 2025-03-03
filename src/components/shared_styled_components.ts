import styled from 'styled-components';

interface SvgWrapperProps {
	align_items?: string;
	justify_content?: string;
}

export const SvgWrapper = styled.div<SvgWrapperProps>`
	display: flex;
	align-items: ${(props) => props.align_items || 'center'};
	justify-content: ${(props) => props.justify_content || 'center'};
	cursor: pointer;
`;

export const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 20px;
	background-color: #f5f5f5;
`;

export const Button = styled.button`
	padding: 10px 20px;
	margin: 10px;
	background-color: #007bff;
	color: white;
	border: none;
	border-radius: 5px;
	cursor: pointer;

	&:hover {
		background-color: #0056b3;
	}
`;

export const Input = styled.input`
	padding: 10px;
	margin: 10px;
	border: 1px solid #ccc;
	border-radius: 5px;
`;

export const Label = styled.label`
	margin: 10px;
	font-size: 16px;
	color: #333;
`;
