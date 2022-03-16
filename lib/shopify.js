const Shopify = require("shopify-api-node");

const table = require("./table");
const log = require("./logger");

/**
 * @param {String} shopOrigin
 * @returns {Promise}
 */
const _shopify = async function (shopOrigin) {
    const [err, shop] = await table.shop.getByOrigin(shopOrigin);

    if (err) {
        return shop;
    }

    const shopify = new Shopify({
        shopName: shopOrigin,
        accessToken: shop.access_token,
        apiVersion: "2020-10",
    });

    try {
        await shopify.accessScope.list();
        return new Promise((resolve) => resolve({ shopify, shop }));
    } catch (e) {
        log.error(e.message);
    }

    return false;
};

module.exports = _shopify;
