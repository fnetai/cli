"use strict";

const express = require("express");
const path = require('path');
const shelljs = require('shelljs');
const { nanoid } = require('nanoid');

class API {

    #wdir;
    constructor(options) {
        this._keycloak = options.keycloak;
        this._router = this._initRouter();
        this._redis_client = options.redisClient;
        this._expire_ttl = 3600; // 1-hour
        this._expire_ttl_short = 300; // 5-minutes
        this.#wdir = options.wdir;
    }

    _initRouter() {
        let router = express.Router();

        router.post('/library/builder/create', this._buildHandler.bind(this));
        router.post('/library/builder/status', this._statusHandler.bind(this));

        return router;
    }

    join(basePath, app) {
        app.use(basePath, this._router);
    }

    async _cache_set(key, value, expire_ttl) {
        await this._redis_client.SETEX(
            key,
            expire_ttl || this._expire_ttl,
            JSON.stringify(value),
        ).catch(console.error);
    }

    async _cache_get(key) {
        const value = await this._redis_client.GET(key).catch(console.error);
        return JSON.parse(value);
    }
    
    _buildHandler(req, res) {
        this._build({ ...req.body })
            .then(response => {
                res.status(200).send(response);
            })
            .catch(error => {
                res.status(500).send();
            });
    }

    _statusHandler(req, res) {
        try {
            const buildId = req.body.id;
            if (!buildId) throw new Error('Build Id is not defined.');

            const buildKey = "BUILD:" + buildId;

            this._cache_get(buildKey).then(response => {
                res.send(response);
            }).catch(error => {
                res.status(500).send();
            });
        }
        catch (error) {
            res.status(500).send();
        }
    }

    async _build(reqContext) {

        const id = reqContext.id;

        if (!id) throw new Error('Library Id is not defined.');

        const buildId = nanoid(24);

        const file = path.resolve(__dirname, 'builder/lib-cli.js');

        const command = `node ${file} build --id=${id} --buildId=${buildId} --mode=all}`;

        shelljs.exec(command, { async: true, cwd: this.#wdir });

        return {
            id: buildId
        }
    }
}

module.exports = API;
