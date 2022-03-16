import {
    Button,
    Card,
    Form,
    FormLayout,
    Layout,
    Page,
    Stack,
    TextField,
    SettingToggle,
    TextStyle,
    Toast,
    Frame,
    Autocomplete,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import areaOptions from "../data/areaOptions";

class Index extends React.Component {
    state = {
        username: "",
        password: "",
        secret_key: "",
        loading: false,
        test_mode: false,
        auto_approve: false,
        message: "",
        pickup_address: {
            address: "",
            area: "",
            street: "",
            additional_details: "",
            latitude: "",
            longitude: "",
        },
        isError: false,
        areaOptions,
        selectedPickupAddressArea: [],
    };

    areaOptions = areaOptions;

    render() {
        const {
            username,
            password,
            secret_key,
            test_mode,
            auto_approve,
            message,
            isError,
            pickup_address,
            loading,
            areaOptions,
            selectedPickupAddressArea,
        } = this.state;

        return (
            <Frame>
                <Page>
                    <TitleBar title="Configuration" />
                    <Layout>
                        <Layout.AnnotatedSection
                            title="API Configuration"
                            description="Add your API details provided by Go Wagon."
                        >
                            <Card sectioned>
                                <Form onSubmit={this.handleAPISubmit}>
                                    <FormLayout>
                                        <SettingToggle
                                            action={{
                                                onAction: this.handleToggle(
                                                    "test_mode"
                                                ),
                                                content: this.state.test_mode
                                                    ? "Disable"
                                                    : "Enable",
                                                disabled: this.state.loading,
                                            }}
                                            enabled={test_mode}
                                        >
                                            Test Mode is{" "}
                                            <TextStyle variation="strong">
                                                {test_mode
                                                    ? "enabled"
                                                    : "disabled"}
                                            </TextStyle>
                                        </SettingToggle>
                                        <TextField
                                            value={username}
                                            label="API Username"
                                            onChange={this.handleAPIChange(
                                                "username"
                                            )}
                                            disabled={loading}
                                            autoComplete={false}
                                        />
                                        <TextField
                                            value={password}
                                            label="API Password"
                                            onChange={this.handleAPIChange(
                                                "password"
                                            )}
                                            type="password"
                                            disabled={loading}
                                            autoComplete={false}
                                        />
                                        <TextField
                                            value={secret_key}
                                            label="API Secret Key"
                                            onChange={this.handleAPIChange(
                                                "secret_key"
                                            )}
                                            disabled={loading}
                                            autoComplete={false}
                                            type="password"
                                        />
                                        <SettingToggle
                                            action={{
                                                onAction: this.handleToggle(
                                                    "auto_approve"
                                                ),
                                                content: this.state.auto_approve
                                                    ? "Disable"
                                                    : "Enable",
                                                disabled: this.state.loading,
                                            }}
                                            enabled={auto_approve}
                                        >
                                            Auto Order Fulfillment is{" "}
                                            <TextStyle variation="strong">
                                                {auto_approve
                                                    ? "enabled"
                                                    : "disabled"}
                                            </TextStyle>
                                        </SettingToggle>
                                        <Stack distribution="trailing">
                                            <Button
                                                primary
                                                submit
                                                disabled={loading}
                                                loading={loading}
                                            >
                                                Save
                                            </Button>
                                        </Stack>
                                    </FormLayout>
                                </Form>
                            </Card>
                        </Layout.AnnotatedSection>
                        <Layout.AnnotatedSection
                            title="Pickup Address"
                            description="Input your pickup address details. Please copy one of the pickup address from your Go Wagon admin panel"
                        >
                            <Card sectioned>
                                <Form onSubmit={this.handlePickupAddressSubmit}>
                                    <FormLayout>
                                        <TextField
                                            value={pickup_address.address}
                                            label="Address"
                                            onChange={this.handlePickupAddressChange(
                                                "address"
                                            )}
                                            disabled={loading}
                                        />
                                        <Autocomplete
                                            options={areaOptions}
                                            textField={
                                                <Autocomplete.TextField
                                                    onChange={
                                                        this
                                                            .handlePickupAddressAreaChange
                                                    }
                                                    label="Area"
                                                    value={pickup_address.area}
                                                    placeholder="Search"
                                                    disabled={loading}
                                                />
                                            }
                                            selected={selectedPickupAddressArea}
                                            onSelect={
                                                this
                                                    .updatePickupAddressAreaSelection
                                            }
                                        />
                                        <TextField
                                            value={pickup_address.street}
                                            label="Street"
                                            onChange={this.handlePickupAddressChange(
                                                "street"
                                            )}
                                            disabled={loading}
                                        />
                                        <TextField
                                            value={
                                                pickup_address.additional_details
                                            }
                                            label="Additional Details"
                                            onChange={this.handlePickupAddressChange(
                                                "additional_details"
                                            )}
                                            disabled={loading}
                                        />
                                        <TextField
                                            value={pickup_address.latitude}
                                            label="Latitude"
                                            disabled={loading}
                                            readOnly={true}
                                            helpText={
                                                <i>
                                                    Auto populates based on{" "}
                                                    <strong>Area</strong>{" "}
                                                    selection.
                                                </i>
                                            }
                                        />
                                        <TextField
                                            value={pickup_address.longitude}
                                            label="Longitude"
                                            disabled={loading}
                                            readOnly={true}
                                            helpText={
                                                <i>
                                                    Auto populates based on{" "}
                                                    <strong>Area</strong>{" "}
                                                    selection.
                                                </i>
                                            }
                                        />
                                        <Stack distribution="trailing">
                                            <Button
                                                primary
                                                submit
                                                disabled={loading}
                                                loading={loading}
                                            >
                                                Save
                                            </Button>
                                        </Stack>
                                    </FormLayout>
                                </Form>
                            </Card>
                        </Layout.AnnotatedSection>
                    </Layout>

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

    async getConfig() {
        this.setState({ loading: true });

        try {
            const res = await fetch(`/api/config`);
            const body = await res.json();
            if (body.success) {
                this.setState({
                    username: body.data.username,
                    password: body.data.password,
                    secret_key: body.data.secret_key,
                    test_mode: body.data.test_mode,
                    auto_approve: body.data.auto_approve,
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            this.setState({ loading: false });
        }
    }

    async getPickupAddress() {
        this.setState({ loading: true });

        try {
            const res = await fetch(`/api/pickup_address`);
            const body = await res.json();
            if (body.success && Object.keys(body.data).length) {
                this.setState({
                    pickup_address: body.data,
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            this.setState({ loading: false });
        }
    }

    async saveAPIConfig(config) {
        this.setState({ loading: true });

        const {
            username,
            password,
            secret_key,
            test_mode,
            auto_approve,
        } = config;

        try {
            const res = await fetch(`/api/config`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                    secret_key,
                    test_mode,
                    auto_approve,
                }),
            });
            const body = await res.json();
            this.setToast("Settings Saved");
        } catch (e) {
            this.setToast(`Failed: ${e.message}`, true);
        } finally {
            this.setState({ loading: false });
        }
    }

    async savePickupAddress(pickup_address) {
        this.setState({ loading: true });

        try {
            const res = await fetch(`/api/pickup_address`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(pickup_address),
            });
            const body = await res.json();
            this.setToast("Settings Saved");
        } catch (e) {
            this.setToast(`Failed: ${e.message}`, true);
        } finally {
            this.setState({ loading: false });
        }
    }

    componentDidMount() {
        this.getConfig();
        this.getPickupAddress();
    }

    handleAPIChange = (field) => {
        return (value) => this.setState({ [field]: value });
    };

    handleAPISubmit = () => {
        this.setState({
            username: this.state.username,
            password: this.state.password,
            secret_key: this.state.secret_key,
            test_mode: this.state.test_mode,
            auto_approve: this.state.auto_approve,
        });
        this.clearToast();
        this.saveAPIConfig(this.state);
    };

    handlePickupAddressChange = (field) => {
        return (value) =>
            this.setState((prevState) => ({
                pickup_address: { ...prevState.pickup_address, [field]: value },
            }));
    };

    handlePickupAddressSubmit = () => {
        this.setState({
            pickup_address: this.state.pickup_address,
        });

        const validate = Object.entries(this.state.pickup_address).every(
            (value) => value[1].trim() && value[1]
        );

        if (!validate) {
            this.setToast("Pickup Address: All fields are required", true);
            return;
        }

        this.clearToast();
        this.savePickupAddress(this.state.pickup_address);
    };

    handleToggle = (key) => {
        return (e) => {
            e.preventDefault();
            const value = !this.state[key];
            return this.setState({ [key]: value });
        };
    };

    clearToast = () => {
        return this.setState({ message: "", isError: false });
    };

    setToast = (message, isError = false) => {
        return this.setState({ message, isError });
    };

    handlePickupAddressAreaChange = (value) => {
        this.handlePickupAddressChange("area")(value);

        if (value === "") {
            this.setState({ areaOptions: this.areaOptions });
            return;
        }

        const filterRegex = new RegExp(value, "i");
        const resultOptions = this.areaOptions.filter((option) =>
            option.label.match(filterRegex)
        );
        this.setState({ areaOptions: resultOptions });
    };

    updatePickupAddressAreaSelection = (selected) => {
        const selectedValue = selected.map((selectedItem) => {
            const matchedOption = this.state.areaOptions.find((option) => {
                return option.value.match(selectedItem);
            });
            return matchedOption;
        });

        const pickup_address = { ...this.state.pickup_address };
        pickup_address.area = selectedValue[0].label;
        pickup_address.latitude = selectedValue[0].latitude;
        pickup_address.longitude = selectedValue[0].longitude;

        this.setState({
            selectedPickupAddressArea: selected,
            pickup_address,
        });
    };
}

export default Index;
