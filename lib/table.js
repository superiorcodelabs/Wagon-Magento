const escape = require("sql-template-strings");
const dayjs = require("dayjs");

const db = require("./db");
const log = require("./logger");

module.exports = {
    shop: {
        async insertUpdate({ shop, accessToken }) {
            const datetime = dayjs().format("YYYY-MM-DD HH:mm:ss");
            const query = escape`
                INSERT INTO shop
                    (origin, access_token, created_at, updated_at)
                VALUES(${shop}, ${accessToken}, ${datetime}, ${datetime})
                    ON DUPLICATE KEY UPDATE
                    access_token=${accessToken}, updated_at=${datetime}
            `;
            return await db.query(query);
        },
        /**
         *
         * @param {String} origin
         * @returns {Array}
         */
        async getByOrigin(origin) {
            const oauth = await db.query(escape`
                SELECT *
                FROM shop
                WHERE origin = ${origin}
                LIMIT 1
            `);

            if (oauth.error) {
                log.error(oauth.error);
                return [true, oauth.error.message];
            }

            if (!oauth.length) {
                return [true, null];
            }

            return [false, oauth[0]];
        },
        /**
         *
         * @param {Number} Id
         * @returns {Array}
         */
        async getById(Id) {
            const oauth = await db.query(escape`
                SELECT *
                FROM shop
                WHERE id = ${Id}
                LIMIT 1
            `);

            if (oauth.error) {
                log.error(oauth.error);
                return [true, oauth.error.message];
            }

            if (!oauth.length) {
                return [true, null];
            }

            return [false, oauth[0]];
        },
        async remove(shop_id) {
            const query = escape`DELETE FROM shop WHERE id = ${shop_id}`;
            return await db.query(query);
        },
    },
    shop_config: {
        /**
         * @param {Number} shop_id
         * @returns {Array}
         */
        async findByShopID(shop_id) {
            const query = escape`
            SELECT username, password, secret_key, test_mode, auto_approve
               FROM shop_config
               INNER JOIN shop ON shop_config.shop_id = shop.id
               WHERE shop_config.shop_id = ${shop_id}
               LIMIT 1
            `;
            const row = await db.query(query);

            if (row.error) {
                return [true, null];
            }

            return [false, row[0]];
        },
        async insertUpdate({
            shop_id,
            username,
            password,
            secret_key,
            test_mode,
            auto_approve,
        }) {
            const datetime = dayjs().format("YYYY-MM-DD HH:mm:ss");
            const query = escape`
                INSERT INTO shop_config
                    (shop_id, username, password, secret_key, test_mode, auto_approve, created_at, updated_at)
                VALUES(${shop_id}, ${username}, ${password}, ${secret_key}, ${test_mode}, ${auto_approve}, ${datetime}, ${datetime})
                    ON DUPLICATE KEY UPDATE
                    username=${username}, password=${password}, secret_key=${secret_key}, test_mode=${test_mode}, auto_approve=${auto_approve}, updated_at=${datetime}
            `;
            return await db.query(query);
        },
    },
    shop_pickup_address: {
        /**
         * @param {Number} shop_id
         * @returns {Array}
         */
        async findByShopID(shop_id) {
            const query = escape`
            SELECT address, area, street, additional_details, latitude, longitude
               FROM shop_pickup_address
               INNER JOIN shop ON shop_pickup_address.shop_id = shop.id
               WHERE shop_pickup_address.shop_id = ${shop_id}
               LIMIT 1
            `;
            const row = await db.query(query);

            if (row.error) {
                return [true, null];
            }

            return [false, row[0]];
        },
        async insertUpdate({
            shop_id,
            address,
            area,
            street,
            additional_details,
            latitude,
            longitude,
        }) {
            const datetime = dayjs().format("YYYY-MM-DD HH:mm:ss");
            const query = escape`
                INSERT INTO shop_pickup_address
                    (shop_id, address, area, street, additional_details, latitude, longitude, created_at, updated_at)
                VALUES(${shop_id}, ${address}, ${area}, ${street}, ${additional_details}, ${latitude}, ${longitude}, ${datetime}, ${datetime})
                    ON DUPLICATE KEY UPDATE
                    address=${address}, area=${area}, street=${street}, additional_details=${additional_details},
                    latitude=${latitude}, longitude=${longitude}, updated_at=${datetime}
            `;
            return await db.query(query);
        },
    },
    shop_webhooks: {
        async insert({ shop_id, webhook_topic, object_id, webhook_payload }) {
            const query = escape`
                INSERT INTO shop_webhooks
                    (shop_id, webhook_topic, object_id, webhook_payload)
                VALUES(${shop_id}, ${webhook_topic}, ${object_id}, ${webhook_payload})
            `;
            return await db.query(query);
        },
        async findBy({ shop_id, object_id }) {
            const query = escape`
            SELECT webhook_payload
               FROM shop_webhooks
               INNER JOIN shop ON shop_webhooks.shop_id = shop.id
               WHERE shop_webhooks.shop_id = ${shop_id} AND shop_webhooks.object_id = ${object_id}
               LIMIT 1
            `;
            const row = await db.query(query);

            if (row.error) {
                return [true, null];
            }

            return [false, row[0]];
        },
    },
    shop_scripttag: {
        async insert({ shop_id, scripttag_id }) {
            const datetime = dayjs().format("YYYY-MM-DD HH:mm:ss");
            const query = escape`
                INSERT INTO shop_scripttag
                    (shop_id, scripttag_id, created_at)
                VALUES(${shop_id}, ${scripttag_id}, ${datetime})
            `;
            return await db.query(query);
        },
        /**
         * @param {Number} shop_id
         * @returns {Array}
         */
        async findByShopID(shop_id) {
            const query = escape`
            SELECT scripttag_id
               FROM shop_scripttag
               INNER JOIN shop ON shop_scripttag.shop_id = shop.id
               WHERE shop_scripttag.shop_id = ${shop_id}
               LIMIT 1
            `;
            const row = await db.query(query);

            if (row.error) {
                return [true, null];
            }

            return [false, row[0]];
        },
        async remove(shop_id) {
            const query = escape`
                DELETE FROM shop_scripttag
                WHERE shop_id = ${shop_id}
            `;
            return await db.query(query);
        },
    },
};
