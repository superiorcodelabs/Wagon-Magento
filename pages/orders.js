import { Page, Toast, Frame } from "@shopify/polaris";
import ResourceListWithOrders from "../components/ResourceListWithOrders";

class Index extends React.Component {
    state = {
        message: "",
        isError: false,
    };

    render() {
        const { message, isError } = this.state;

        return (
            <Frame>
                <Page
                    fullWidth
                    title="Orders"
                    subtitle="List of orders to approve for Go Wagon shipping"
                >
                    <ResourceListWithOrders
                        clearToast={this.clearToast}
                        setToast={this.setToast}
                    />

                    {message ? (
                        <Toast
                            content={message}
                            onDismiss={this.clearToast}
                            error={isError}
                        />
                    ) : (
                        ""
                    )}
                </Page>
            </Frame>
        );
    }

    componentDidMount() {}

    clearToast = () => {
        return this.setState({ message: "", isError: false });
    };

    setToast = (message, isError = false) => {
        return this.setState({ message, isError });
    };
}

export default Index;
