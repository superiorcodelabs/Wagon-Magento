const path = require("path");
const webpack = require("webpack");
const dotenv = require("dotenv").config({
    path: path.join(__dirname, "../.env"),
});

module.exports = {
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
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            HOST: `"${dotenv.parsed.HOST}"`,
        }),
    ],
};
