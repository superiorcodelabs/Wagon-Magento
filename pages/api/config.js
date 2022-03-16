import shopifyInstance from "../../lib/shopify";
import table from "../../lib/table";
import log from "../../lib/logger";

const { HOST } = process.env;

export default async (req, res) => {
    const shopOrigin = req.cookies["shopOrigin"];
    const shopifyInit = await shopifyInstance(shopOrigin);
    if (!shopifyInit) {
        return res.status(404).json({ success: false });
    }

    const { shop, shopify } = shopifyInit;

    let data = {};
    let success = true;

    try {
        const [err, shop_config] = await table.shop_config.findByShopID(
            shop.id
        );

        if (!err && shop_config) {
            data = shop_config;
        }

        if (req.method === "POST") {
            data = {
                username: req.body.username,
                password: req.body.password,
                secret_key: req.body.secret_key,
                test_mode:
                    req.body.test_mode != null ? req.body.test_mode : false,
                auto_approve:
                    req.body.auto_approve != null
                        ? req.body.auto_approve
                        : false,
            };

            await table.shop_config.insertUpdate({
                shop_id: shop.id,
                ...data,
            });

            await registerScriptTag(shopify, shop.id);
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

/**
 * Register Script Tag for code injection on template files
 * @param {Object} shopify
 * @param {Number} shop_id
 * @returns {Object|false}
 */
async function registerScriptTag(shopify, shop_id) {
    try {
        let [err, scriptTag] = await table.shop_scripttag.findByShopID(shop_id);
        if (err || !scriptTag) {
            const scriptTagCreate = await shopify.scriptTag.create({
                event: "onload",
                src: `${HOST}/main.js`,
                display_scope: "online_store",
            });
            log.info("scriptTagCreate ", scriptTagCreate);

            await table.shop_scripttag.insert({
                shop_id,
                scripttag_id: scriptTagCreate.id,
            });
        }

        return true;
    } catch (e) {
        log.error(e);
    }

    return false;
}
