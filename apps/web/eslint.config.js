import { nextJsConfig } from "@repo/eslint-config/next-js";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
	...nextJsConfig,
	{
		rules: {
			"@next/next/no-img-element": "off",
			"@next/next/no-html-link-for-pages": "off",
			"@next/next/google-font-display": "off",
			"@next/next/no-page-custom-font": "off",
			"react/no-unknown-property": "off",
		},
	},
	{
		files: ["scripts/**/*.{js,mjs,cjs}"],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			"turbo/no-undeclared-env-vars": "off",
		},
	},
];
