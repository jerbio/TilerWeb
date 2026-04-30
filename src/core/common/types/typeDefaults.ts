// This file defines default values for various types used in the application. These defaults can be used to ensure that components have consistent initial values when certain properties are not provided.
const ColorDefaults = {
	red: 125,
	green: 125,
	blue: 125,
};

export const TypeDefaults = {
	RGBColor: ColorDefaults,
} as const;
