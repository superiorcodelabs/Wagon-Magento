import shopifyInstance from "../../lib/shopify";
import table from "../../lib/table";
import log from "../../lib/logger";
const { shopifyGetOrder } = require("../../lib/go-wagon-calls");

export default async (req, res) => {
    if (req.method !== "POST") {
        return res.status(400).json({ message: "Bad request" });
    }

    const shopifyInit = await shopifyInstance(req.cookies["shopOrigin"]);
    if (!shopifyInit) {
        return res.status(404).json({});
    }

    const { shop } = shopifyInit;

    let data = {};

    try {
        const [err, shop_webhook] = await table.shop_webhooks.findBy({
            shop_id: shop.id,
            object_id: req.body.object_id,
        });

        if (err) {
            throw err;
        }

        const { address } = req.body;

        const payload = JSON.parse(shop_webhook?.webhook_payload ?? "{}");

        const order = await shopifyAddUpdateArea({
            origin: shop.origin,
            accessToken: shop.access_token,
            orderId: payload.admin_graphql_api_id,
            address,
        });

        if (order === false) {
            throw new Error("Order not found");
        }

        data = { message: "Area Updated", ...order };
        res.statusCode = 200;
    } catch (e) {
        res.statusCode = 400;
        data.message = e.message;
    }

    res.json({ ...data });
};

async function shopifyAddUpdateArea({ origin, accessToken, orderId, address }) {
    const order = await shopifyGetOrder({ origin, accessToken, orderId });
    if (order === false) {
        return false;
    }

    let customAttributes = order?.customAttributes || [];
    customAttributes = customAttributes.map((attribute) => ({
        key: attribute.key,
        value: attribute.value,
    }));

    let areaAttribute = customAttributes.findIndex(
        (attribute) => attribute.key === "go_wagon_area"
    );

    let latitudeAttribute = customAttributes.findIndex(
        (attribute) => attribute.key === "go_wagon_area_latitude"
    );

    let longitudeAttribute = customAttributes.findIndex(
        (attribute) => attribute.key === "go_wagon_area_longitude"
    );

    if (areaAttribute === -1) {
        const shipment = {
            key: "go_wagon_area",
            value: address.area,
        };
        customAttributes.push(shipment);
    } else {
        customAttributes[areaAttribute].value = address.area;
    }

    if (latitudeAttribute === -1) {
        const shipment = {
            key: "go_wagon_area_latitude",
            value: address.latitude,
        };
        customAttributes.push(shipment);
    } else {
        customAttributes[latitudeAttribute].value = address.latitude;
    }

    if (longitudeAttribute === -1) {
        const shipment = {
            key: "go_wagon_area_longitude",
            value: address.longitude,
        };
        customAttributes.push(shipment);
    } else {
        customAttributes[longitudeAttribute].value = address.longitude;
    }

    const input = {
        id: orderId,
        customAttributes,
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

        return true;
    } catch (e) {
        log.error(e.message);
    }

    return false;
}
