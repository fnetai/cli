const { Api } = require("@flownet/lib-atom-api-js");
const axios = require('axios').default;
const qs = require('qs');

module.exports = class {
    init({ config, accessToken }) {
        return new Promise((resolve, reject) => {

            Api.set_api_url(config.data.url);

            if (accessToken) {
                Api.set_req_token(accessToken);
                resolve(accessToken);
                return;
            }

            axios({
                method: "POST",
                url: `${config.data.issuer}/protocol/openid-connect/token`,
                data: qs.stringify(config.data.grant.params),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
            }).then(response => {
                Api.set_req_token(response.data.access_token);
                resolve(response.data.access_token);
            }).catch(error => {
                Api.set_req_token();
                reject(error);
            });
        });
    }
}