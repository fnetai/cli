const cwd = process.cwd();

const fnetConfig = require('@fnet/config');

async function run() {

    await fnetConfig({
        name: ["server", "redis"],
        dir: cwd,
        optional: true,
    });

    const redisClient = await require('./redisClient')();
    if (!redisClient) throw new Error("Redis is offline.");

    const PackageJSON = require("../package.json");

    const express = require("express");
    const helmet = require("helmet");
    const cors = require('cors');

    const API = require("./wf-api");
    const LIBAPI = require("./lib-api");

    const requestIp = require("request-ip");

    // KEYCLOAK
    const session = require('express-session');
    const MemoryStore = session.MemoryStore;
    const memoryStore = new MemoryStore();

    const Keycloak = require('keycloak-connect');
    const keycloak = new Keycloak({ store: memoryStore });

    // web server
    const app = express();

    const qs = require('qs');
    app.set('query parser', function (str) {
        return qs.parse(str, { depth: 12 });
    });

    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        store: memoryStore
    }));

    app.use(cors());

    // add a little bit security
    app.use(helmet());

    // parse application/json
    app.use(express.json({
        limit: "1024kb"
    }));

    // health check
    app.get("/healthz", function (req, res) {
        res.sendStatus(200);
    });

    app.use(requestIp.mw());

    // keycloak middleware
    app.use(keycloak.middleware());

    // bind API
    new API({ keycloak, wdir: cwd, redisClient }).join("/v1", app);
    new LIBAPI({ keycloak, wdir: cwd, redisClient }).join("/v1", app);

    //port
    app.listen(process.env.HTTP_PORT || 8080);

    console.log(`[${PackageJSON.version}] ${PackageJSON.name} started.`);
}

// run
run().catch((err) => {
    console.error(err.message);
    process.exit(1);
});