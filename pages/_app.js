import "../style.css";
import App from "next/app";
import Head from "next/head";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/dist/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import { Provider } from "@shopify/app-bridge-react";
import Cookies from "js-cookie";
import ClientRouter from "../components/ClientRouter";
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "react-apollo";

const client = new ApolloClient({
    fetchOptions: {
        credentials: "include",
    },
});

class MyApp extends App {
    render() {
        const { Component, pageProps } = this.props;
        const shopHost = shopOrigin + '/admin';
        const config = {
            apiKey: API_KEY,
            shopOrigin: Cookies.get("shopOrigin"),
            host: Buffer.from(shopHost).toString('base64'),
            forceRedirect: true,
        };

        return (
            <React.Fragment>
                <Head>
                    <title>Go Wagon</title>
                    <meta charSet="utf-8" />
                </Head>
                <Provider config={config}>
                    <ClientRouter />
                    <AppProvider i18n={translations}>
                        <ApolloProvider client={client}>
                            <Component {...pageProps} />
                        </ApolloProvider>
                    </AppProvider>
                </Provider>
            </React.Fragment>
        );
    }
}

export default MyApp;
