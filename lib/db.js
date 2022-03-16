const mysql = require("serverless-mysql");

const log = require("./logger");

const db = mysql({
    config: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
    },
});

module.exports = {
    async query(query) {
        try {
            const results = await db.query(query);
            await db.end();
            return results;
        } catch (error) {
            log.error(error);
            return { error };
        }
    },
};
