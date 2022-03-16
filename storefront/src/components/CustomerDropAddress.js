import React, { Component } from "react";
import ReactDOM from "react-dom";
import Select from "react-select";

import areaOptions from "../../../data/areaOptions";

const $cart = document.querySelector(".cart");
const $checkoutBtn = $cart.querySelector("[name='checkout'][type='submit']");

class CustomerDropAddress extends Component {
    state = {
        area: "",
        loading: false,
    };

    proceed = false;

    async componentDidMount() {
        try {
            const cart = await this.getCart();
            if (cart.attributes && cart.attributes.go_wagon_area) {
                const { go_wagon_area: area } = cart.attributes;

                this.setState({
                    area,
                });
            }
        } catch (e) {
            console.error("Error fetching cart", e);
        }

        $cart.addEventListener("submit", (e) => {
            if (!this.proceed) {
                e.preventDefault();
                this.submitCheckout();
            }
        });
    }

    async submitCheckout() {
        if (!this.isFormValid()) {
            alert("Please fill out the Drop address area");

            return;
        }

        const area = this.areaObject(this.state.area);

        if (!area) {
            alert("Invalid area value");
            return;
        }

        const { latitude, longitude } = area;

        try {
            this.setState({ loading: true });
            $checkoutBtn.setAttribute("disabled", "disabled");

            await fetch("/cart/update.js", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    attributes: {
                        go_wagon_area: this.state.area,
                        go_wagon_area_latitude: latitude,
                        go_wagon_area_longitude: longitude,
                    },
                }),
            });
            this.proceed = true;
        } catch (e) {
            console.error(e);
            alert(e.message);
            this.setState({ loading: false });
        } finally {
            $checkoutBtn.removeAttribute("disabled");
            if (this.proceed) {
                $cart.submit();
            }
        }
    }

    isFormValid() {
        const { area } = this.state;
        return area.trim();
    }

    handleChange = (field) => {
        return (event) => {
            const { value } = field === "area" ? event : event.target;
            return this.setState({ [field]: value });
        };
    };

    areaObject(area) {
        return areaOptions.find((option) => {
            return option.value === area;
        });
    }

    async getCart() {
        const response = await fetch("/cart.js");
        return await response.json();
    }

    render() {
        const { area, loading } = this.state;

        return (
            <div id="go-wagon-drop-wrapper">
                <div className="go-wagon-logo">
                    <img src={`${HOST}/img/logo.webp`} alt="Go Wagon" />
                </div>
                <div id="gw-field-wrapper-cont">
                    <h2>Select your drop address</h2>
                    <div id="gw-field-wrapper">
                        <div className="gw-field">
                            <label htmlFor="gw-field-area" className="gw-label">
                                Area
                            </label>
                            <Select
                                options={areaOptions}
                                isDisabled={loading}
                                name="gw_field_area"
                                className="gw-input"
                                onChange={this.handleChange("area")}
                                inputId="gw-field-area"
                                value={this.areaObject(area)}
                            />
                            <input
                                type="hidden"
                                name="checkout"
                                value="Check out"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default CustomerDropAddress;

let cart = document.querySelector(".cart__footer");
if (!cart) {
    cart = document.querySelector(".cart");
}
const wrapper = document.createElement("div");
wrapper.setAttribute("id", "go-wagon-drop-details");

if (cart) {
    cart.prepend(wrapper);
    ReactDOM.render(<CustomerDropAddress />, wrapper);
}
