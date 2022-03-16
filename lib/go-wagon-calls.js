const fetch = require("node-fetch");

const table = require("./table");
const log = require("./logger");

module.exports = {
    createShipment: async (shop, payload, force_create = false) => {
        const shop_id = shop.id;

        const [err1, shop_config] = await table.shop_config.findByShopID(
            shop_id
        );

        if (err1 || !shop_config) {
            return false;
        }

        if (shop_config.auto_approve === 0 && !force_create) {
            log.info("Auto approve is disabled");
            return false;
        }

        log.info(
            `--Creating Go Wagon Shipment--\nSTORE: ${shop.origin}\nORDER_RESOURCE: ${payload.id}\nORDER_NAME: ${payload.order_number}`
        );

        const dropAddress = {};
        const dropDetailsKeys = [
            "go_wagon_address",
            "go_wagon_area",
            "go_wagon_area_latitude",
            "go_wagon_area_longitude",
        ];

        if (!payload.note_attributes) {
            log.error(`Empty note_attributes`);
            return false;
        }

        payload.note_attributes.forEach((attribute) => {
            if (dropDetailsKeys.indexOf(attribute.name) > -1) {
                dropAddress[attribute.name] = attribute.value;
            }
        });

        if (!Object.keys(dropAddress).length) {
            log.error(`dropAddress object has no length`);
            return;
        }

        const [
            err2,
            shop_pickup_address,
        ] = await table.shop_pickup_address.findByShopID(shop_id);

        if (err2) {
            return false;
        }

        var myHeaders = new fetch.Headers();
        myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

        var urlencoded = new URLSearchParams();
        urlencoded.append("email", shop_config.username);
        urlencoded.append("password", shop_config.password);
        urlencoded.append("secret_key", shop_config.secret_key);
        urlencoded.append("pickup_area", shop_pickup_address.area);

        const area_paths = shop_pickup_address.area.split(",");
        if (area_paths.length) {
            const block = area_paths.reverse()[0].trim();
            urlencoded.append("pickup_block", block);
        }

        urlencoded.append("pickup_street", shop_pickup_address.street);
        urlencoded.append("pickup_address", shop_pickup_address.address);
        urlencoded.append("pickup_latitude", shop_pickup_address.latitude);
        urlencoded.append("pickup_longitude", shop_pickup_address.longitude);
        urlencoded.append(
            "pickup_additional_details",
            shop_pickup_address.additional_details
        );

        urlencoded.append("drop_area", dropAddress.go_wagon_area);

        const drop_area_paths = dropAddress.go_wagon_area.split(",");
        if (drop_area_paths.length) {
            const block = drop_area_paths.reverse()[0].trim();
            urlencoded.append("drop_block", block);
        }

        urlencoded.append("drop_street", payload.shipping_address.address2);
        urlencoded.append("drop_address", payload.shipping_address.address1);
        urlencoded.append("drop_latitude", dropAddress.go_wagon_area_latitude);
        urlencoded.append(
            "drop_longitude",
            dropAddress.go_wagon_area_longitude
        );
        urlencoded.append(
            "drop_additional_details",
            payload.shipping_address.address2 || payload.customer.note
        );
        urlencoded.append(
            "receiver_name",
            `${payload.customer.first_name} ${payload.customer.last_name}`
        );

        const receiverPhone =
            payload.shipping_address.phone || payload.customer.phone;
        const recieverPhoneValidated = receiverPhone.replace(/[^\+0-9]/gm, "");

        urlencoded.append("receiver_phone", recieverPhoneValidated);

        const line_items = payload.line_items
            .map((line_item) => line_item.name)
            .join(", ");
        urlencoded.append("shipment_package_name", line_items);

        urlencoded.append("shipment_package_value", payload.total_price);
        urlencoded.append("invoice_no", payload.order_number);
        const [date, time] = payload.created_at.split("T");
        urlencoded.append("scheduled_date", date);
        urlencoded.append("scheduled_time", time);

        log.info("payload ", urlencoded.toString());

        var requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: urlencoded,
            redirect: "follow",
        };

        try {
            log.info("test_mode ", shop_config.test_mode);
            const response = await fetch(
                getAPIURL(shop_config.test_mode, "create_shipment"),
                requestOptions
            );
            const json = await response.json();

            log.info(json);

            if (json.status === 0) {
                throw new Error(json.message);
            }

            const shipmentId = json?.data?.shipment_id;
            let order = { ...json };

            if (
                shipmentId &&
                (force_create || shop_config.auto_approve === 1)
            ) {
                order = await shopifyNewMetaField({
                    origin: shop.origin,
                    accessToken: shop.access_token,
                    orderId: payload.admin_graphql_api_id,
                    shipmentId,
                });

                order = { order, shipmentId };
            }

            return { err: false, message: json.message, order };
        } catch (e) {
            log.error(e.message);
            return { err: true, message: e.message };
        }
    },
    shopifyGetOrder,
    shopifyNewMetaField,
};

function getAPIURL(test_mode, path) {
    const baseUrl = test_mode ? "http://go-wagon.com" : "https://urwagon.com";

    return `${baseUrl}/wagon_backendV2/public/thirdparty/api/${path}`;
}

async function shopifyGetOrder({ origin, accessToken, orderId }) {
    const opts = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
            query: `query getOrder($id: ID!) {
                order(id: $id) {
                    metafield(
                        namespace: "go_wagon"
                        key: "go_wagon_shipment_id"
                    ) {
                        id
                        key
                        value
                    }
                    customAttributes {
                        key
                        value
                    }
                }
            }`,
            variables: {
                id: orderId,
            },
        }),
    };

    try {
        const res = await fetch(
            `https://${origin}/admin/api/graphql.json`,
            opts
        );
        const json = await res.json();
        return json?.data?.order ? json.data.order : false;
    } catch (e) {
        log.error(e.message);
    }

    return false;
}

async function shopifyNewMetaField({
    origin,
    accessToken,
    orderId,
    shipmentId,
}) {
    const order = await shopifyGetOrder({ origin, accessToken, orderId });
    if (order === false) {
        return false;
    }

    let customAttributes = order?.customAttributes || [];
    customAttributes = customAttributes.map((attribute) => ({
        key: attribute.key,
        value: attribute.value,
    }));

    let shipmentAttribute = customAttributes.findIndex(
        (attribute) => attribute.key === "_go_wagon_shipment_id"
    );

    shipmentId = String(shipmentId);

    if (shipmentAttribute === -1) {
        const shipment = {
            key: "_go_wagon_shipment_id",
            value: shipmentId,
        };
        customAttributes.push(shipment);
    } else {
        customAttributes[shipmentAttribute].value = shipmentId;
    }

    const metafields = {
        namespace: "go_wagon",
        key: "go_wagon_shipment_id",
        value: shipmentId,
        valueType: "STRING",
        description: "Whether shipment is sent or not to Go Wagon",
    };

    if (order?.metafield) {
        metafields.id = order.metafield.id;
    }

    const input = {
        id: orderId,
        customAttributes,
        metafields,
    };

    const opts = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
            query: `mutation orderUpdate($input: OrderInput!) {
                orderUpdate(input: $input) {
                    order {
                        id
                        customAttributes {
                            key
                            value
                        }
                        metafields(first: 10, namespace: "go_wagon") {
                            edges {
                                node {
                                    id
                                    namespace
                                    key
                                    value
                                }
                            }
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }`,
            variables: {
                input,
            },
        }),
    };

    try {
        const res = await fetch(
            `https://${origin}/admin/api/graphql.json`,
            opts
        );
        const json = await res.json();
        const order = json.data?.orderUpdate?.order;
        const userErrors = json.data?.orderUpdate?.userErrors;
        if (!order && userErrors) {
            userErrors.forEach((error) => log.error(error));
            return null;
        }

        return order;
    } catch (e) {
        log.error(e.message);
    }

    return false;
}
