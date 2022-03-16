import shopifyInstance from "../../lib/shopify";
import table from "../../lib/table";
import log from "../../lib/logger";

export default async (req, res) => {
    const shopifyInit = await shopifyInstance(req.cookies["shopOrigin"]);
    if (!shopifyInit) {
        return res.status(404).json({ success: false });
    }

    const { shop } = shopifyInit;

    let data = {};
    let success = true;

    try {
        const [
            err,
            shop_pickup_address,
        ] = await table.shop_pickup_address.findByShopID(shop.id);

        if (!err && shop_pickup_address) {
            data = shop_pickup_address;
        }

        if (req.method === "POST") {
            data = {
                additional_details: req.body.additional_details,
                address: req.body.address,
                area: req.body.area,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                street: req.body.street,
            };

            await table.shop_pickup_address.insertUpdate({
                shop_id: shop.id,
                ...data,
            });
        }

        res.statusCode = 200;
    } catch (e) {
        res.statusCode = 404;
        log.error(e);
        data = e.message;
        success = false;
    }

    res.json({ success, data });
};
