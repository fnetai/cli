const { Api } = require("@flownet/lib-atom-api-js");

module.exports = class {
    init({ config, accessToken }) {
        return new Promise((resolve, reject) => {

            Api.set_api_url(config.data.url);

            if (accessToken) {
                Api.set_req_token(accessToken);
                resolve(accessToken);
                return;
            }

            fetch(`${config.data.issuer}/protocol/openid-connect/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams(config.data.grant.params)
            })
                .then(async (response) => {
                    if (!response.ok) throw new Error(await response.text());
                    return response.json();
                })
                .then(response => {
                    Api.set_req_token(response.access_token);
                    resolve(response.access_token);
                })
                .catch(error => {
                    Api.set_req_token();
                    reject(error);
                });
        });
    }
}