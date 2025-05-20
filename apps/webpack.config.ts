import path from "path";
import { Configuration, WebpackOptionsNormalized } from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";

const buildEnv = process.env.BUILD_ENV ?? "web";
const srcDir = path.join(__dirname, "src");
const manifestDir = path.join(__dirname, "manifests");
const outputDir = path.join(__dirname, "dist", buildEnv);
const version = process.env.BUILD_VERSION ?? "0.0.0";
const historyCount = 10;

module.exports = (_env: any, options: WebpackOptionsNormalized): Configuration => ({
	devtool: options.mode !== "production" ? "source-map" : undefined,
	entry: {
		index: path.join(srcDir, "index"),
		...(buildEnv !== "web" && { settings: path.join(srcDir, "settings", "index") }),
	},
	output: {
		publicPath: "",
		path: path.join(outputDir),
		filename: "[name].js",
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
				},
			},
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: {
					loader: "ts-loader",
				},
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /\.s[ac]ss$/i,
				use: [
					"style-loader",
					"css-loader",
					{
						loader: "sass-loader",
						options: { additionalData: `$history-count: ${historyCount};` },
					},
				],
			},
			{
				test: /\.ejs$/i,
				use: [{ loader: "ejs-easy-loader" }],
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	plugins: [
		new HtmlWebpackPlugin({
			filename: "index.html",
			template: "!!ejs-easy-loader!" + path.join(srcDir, "index.html"),
			chunks: ["index"],
		}),
	],
});
