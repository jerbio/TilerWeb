import React from 'react';

type FeatureCardProps = {
	title: string;
	image: string;
	children: React.ReactNode;
	reversed: boolean;
};

export default function FeatureCard({
	title,
	image,
	children,
	reversed,
}: FeatureCardProps) {
	return (
		<article
			className={`flex text-gray-400 flex-col-reverse ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} justify-center lg:gap-16 ring-1 lg:ring-0 ring-white/30 rounded-lg lg:rounded-none max-w-[400px] lg:max-w-none bg-white/10 lg:bg-white/0 relative`}
		>
			<div className="max-w-[450px] flex flex-col gap-2 justify-center p-4 lg:p-0">
				<h2 className="font-urban text-display-xs lg:text-display-sm font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent leading-[1.1]">
					{title}
				</h2>
				<p className="text-base lg:text-lg">{children}</p>
			</div>
			<div className="overflow-hidden ring-1 ring-[#E6E6E6]/20 rounded-lg w-full lg:w-[450px]">
				<img src={image} alt={`${title} image`} />
			</div>
      <div className='red-dot w-[12px] h-[12px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block rounded-full bg-brand-500'></div>
		</article>
	);
}

