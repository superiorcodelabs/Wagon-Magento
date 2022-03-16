require("isomorphic-fetch");
const dotenv = require("dotenv");
const Koa = require("koa");
const next = require("next");
const { default: createShopifyAuth } = require("@shopify/koa-shopify-auth");
const { verifyRequest } = require("@shopify/koa-shopify-auth");
const session = require("koa-session");

dotenv.config();
const {
    ApiVersion,
    default: graphQLProxy,
} = require("@shopify/koa-shopify-graphql-proxy");

const Router = require("koa-router");
const {
    receiveWebhook,
    registerWebhook,
} = require("@shopify/koa-shopify-webhooks");
const serve = require("koa-static");

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const { SHOPIFY_API_SECRET, SHOPIFY_API_KEY, HOST, SCOPES } = process.env;

const table = require("./lib/table");
const { createShipment } = require("./lib/go-wagon-calls");

const log = require("./lib/logger");

app.prepare().then(() => {
    const server = new Koa();
    const router = new Router();
    server.use(session({ secure: true, sameSite: "none" }, server));

    server.use(serve("storefront/dist"));
    server.use(serve("storefront/assets"));

    server.keys = [SHOPIFY_API_SECRET];

    server.use(
        createShopifyAuth({
            apiKey: SHOPIFY_API_KEY,
            secret: SHOPIFY_API_SECRET,
            // Scopes: https://shopify.dev/docs/admin-api/access-scopes
            scopes: [SCOPES],
            async afterAuth(ctx) {
                const { shop, accessToken } = ctx.session;
                log.info("accessToken ", accessToken);
                const shopQuery = await table.shop.insertUpdate(ctx.session);

                if (!shopQuery.error) {
                    ctx.cookies.set("shopOrigin", shop, {
                        httpOnly: false,
                        secure: true,
                        sameSite: "none",
                    });

                    const shop_id = shopQuery.insertId;

                    await registerWebhookRequest(shop, accessToken);
                }

                ctx.redirect("/");
            },
        })
    );

    const webhook = receiveWebhook({ secret: SHOPIFY_API_SECRET });

    router.post(
        "/webhooks/orders/create",
        webhook,
        webhookMiddleware,
        async (ctx) => {
            const { webhook } = ctx.state;
            const shop = ctx.state.shop;
            createShipment(shop, webhook.payload);
        }
    );

    router.post(
        "/webhooks/app/uninstalled",
        webhook,
        webhookMiddleware,
        async (ctx) => {
            const { id } = ctx.state.shop;
            // Remove Script Tag
            await table.shop_scripttag.remove(id);
        }
    );

    router.post(
        "/webhooks/gdpr/customers/erase",
        webhook,
        webhookMiddleware,
        async (ctx) => {
            ctx.res.statusCode = 200;
            ctx.res.end();
        }
    );

    router.post(
        "/webhooks/gdpr/customers/request_data",
        webhook,
        webhookMiddleware,
        async (ctx) => {
            ctx.res.statusCode = 200;
            ctx.res.end();
        }
    );

    router.post(
        "/webhooks/gdpr/shop/erase",
        webhook,
        webhookMiddleware,
        async (ctx) => {
            ctx.res.statusCode = 200;
            ctx.res.end();
            await table.shop.remove(ctx.state.shop.id);
        }
    );

    server.use(graphQLProxy({ version: ApiVersion.October20 }));
    const routerRequest = async (ctx) => {
        await handle(ctx.req, ctx.res);
        ctx.respond = false;
        ctx.res.statusCode = 200;
    };
    router.get("(.*)", verifyRequest(), routerRequest);
    router.post("(.*)", verifyRequest(), routerRequest);

    server.use(router.allowedMethods());
    server.use(router.routes());

    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
});

/**
 * Register Webhook request
 * @param {String} shop
 * @param {String} accessToken
 * @returns {Promise}
 */
async function registerWebhookRequest(shop, accessToken) {
    const orderCreate = await registerWebhook({
        address: `${HOST}/webhooks/orders/create`,
        topic: "ORDERS_CREATE",
        accessToken,
        shop,
        apiVersion: ApiVersion.October20,
    });

    const appUninstalled = await registerWebhook({
        address: `${HOST}/webhooks/app/uninstalled`,
        topic: "APP_UNINSTALLED",
        accessToken,
        shop,
        apiVersion: ApiVersion.October20,
    });

    const webhooks = await Promise.all([orderCreate, appUninstalled]);
    webhooks.forEach((webhook) => {
        if (webhook.success) {
            log.info("Successfully registered webhook! ", webhook.result.data);
        } else {
            log.error("Failed to register webhook ", webhook.result.data);
        }
    });
}

async function webhookMiddleware(ctx, next) {
    const { webhook } = ctx.state;
    const [err, shop] = await table.shop.getByOrigin(webhook.domain);

    // Early response so shopify should be happy about it
    if (err || !shop) {
        ctx.res.statusCode = 404;
        ctx.res.end();
        return log.error(shop);
    } else {
        ctx.res.statusCode = 200;
        ctx.res.end();
    }

    log.info(
        `Webhook received
        Shop: ${webhook.domain}
        Topic: ${webhook.topic}`
    );

    await table.shop_webhooks.insert({
        shop_id: shop.id,
        webhook_topic: webhook.topic,
        object_id: webhook.payload.id,
        webhook_payload: JSON.stringify(webhook.payload),
    });

    ctx.state.shop = shop;

    next();
}
