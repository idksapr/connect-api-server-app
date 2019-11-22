const fs = require('fs');
const mustache = require('mustache');
const request = require('request');
const config = require('../config');
const logger = require('./tools/logger');

function makeRedirectUrl(reqBody, resBody) {
    const urlQuery = Object.keys(resBody).map(key => {
        const uriComponent = encodeURIComponent(resBody[key]);

        return `${key}=${uriComponent}`;
    }).join('&');

    let url = `${reqBody.callback_url}?${urlQuery}`;

    if (reqBody.state) {
        url = `${url}&state=${reqBody.state}`;
    }
    return url;
}

module.exports = {
    actionLoginForm: (req, res) => {
        const fileName = 'views/signin.mst';

        fs.readFile(fileName, 'utf8', (error, data) => {
            if (error) {
                logger.push(null, null, 'login-form', error);

                return res.redirect(makeRedirectUrl(req.body, {
                    error: 'invalid_login_form',
                    error_description: error.message,
                }));
            }
            const vars = {
                client_id: req.params.client_id,
                client_secret: req.params.client_secret,
                callback_url: req.params.callback_url,
                state: req.params.state,
            };

            return res.send(mustache.render(data, vars));
        });
    },

    actionLoginAjax: (req, res) => {
        request.post({
            url: `${config.get('protocol')}://${req.headers.host}/oauth/token`,
            form: req.body },
            (error, httpResponse, body) => {
                if (error) {
                    logger.push(null, null, 'login-action', error);

                    return res.json({
                        error: 'invalid_login_action',
                        error_description: error.message,
                    });
                }
                const response = JSON.parse(body);

                return response.error ?
                    res.json(response) :
                    res.json({ callback_url: makeRedirectUrl(req.body, response) });
            }
        );
    },
};
