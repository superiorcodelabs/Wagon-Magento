import shopifyInstance from "../../lib/shopify";
import table from "../../lib/table";
import log from "../../lib/logger";
const { createShipment } = require("../../lib/go-wagon-calls");

export default async (req, res) => {
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

        const payload = JSON.parse(shop_webhook?.webhook_payload ?? "{}");

        if (req.method === "POST") {
            const { err, message, order } = await createShipment(
                shop,
                payload,
                true
            );
            if (err) {
                throw new Error(message);
            }

            data = { message, ...order };
        }

        res.statusCode = 200;
    } catch (e) {
        res.statusCode = 400;
        data.message = e.message;
    }

    res.json({ ...data });
};
