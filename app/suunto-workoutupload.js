const axios = require('axios');
let constants = require("./suunto-constants");

function initializeUpload(request, response) {

    const { authorization } = request.headers;

    let config = {
        method: 'post',
        url: `${constants.suuntoBaseUrl}upload/`,
        headers: {
            'Authorization': authorization,
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': process.env.SUUNTO_SUBSCRIPTION_KEY
        },
        data: request.body
    };

    axios(config)
        .then(function (result) {
            response.status(result.status).send(result.data);
        })
        .catch(function (error) {
            if (error.response) {
                response.status(error.response.status).send(error.response.data.message);
            } else {
                response.status(400).send(error.message);
            }
        });
}

function getUploadStatus(request, response) {

    const { authorization } = request.headers;

    let url = `${constants.suuntoBaseUrl}upload/`;
    if (request.params.Id) {
        url += request.params.Id;
    }

    let config = {
        method: 'get',
        url: url,
        headers: {
            'Authorization': authorization,
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': process.env.SUUNTO_SUBSCRIPTION_KEY
        }
    };

    axios(config)
        .then(function (result) {
            response.status(result.status).send(result.data);
        })
        .catch(function (error) {
            if (error.response) {
                response.status(error.response.status).send(error.response.data.message);
            } else {
                response.status(400).send(error.message);
            }
        });
}

module.exports = { initializeUpload, getUploadStatus };
