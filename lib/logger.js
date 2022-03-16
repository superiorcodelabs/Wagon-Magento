const logger = require("simple-node-logger");

const manager = logger.createLogManager();
const { APP_ROOT } = process.env;

const opts = {
    logDirectory: `${APP_ROOT}/logs`,
    fileNamePattern: "log-<DATE>.log",
    dateFormat: "YYYY.MM.DD",
};

manager.createRollingFileAppender(opts);
const log = manager.createLogger();

module.exports = log;
