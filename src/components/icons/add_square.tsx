import Icon from './_icon';

const AddSquare = ({ size = 25 }: { size?: number }) => {
	return (
		<Icon size={size} defaultSize={25}>
			<svg
				width="25"
				height="24"
				viewBox="0 0 25 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M8.5 12H16.5"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M12.5 16V8"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M9.5 22H15.5C20.5 22 22.5 20 22.5 15V9C22.5 4 20.5 2 15.5 2H9.5C4.5 2 2.5 4 2.5 9V15C2.5 20 4.5 22 9.5 22Z"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</Icon>
	);
};

export default AddSquare;
