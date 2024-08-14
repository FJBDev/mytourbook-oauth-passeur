const axios = require('axios');
const xss = require('xss');

function airPollution(request, response) {

    const openWeatherMapBaseUrl = 'https://api.openweathermap.org/data/2.5/air_pollution/history';
    let url = `${openWeatherMapBaseUrl}?appid=${process.env.OPENWEATHERMAP_KEY}`;

    if (request.query.lat) {
        url += `&lat=${xss(request.query.lat)}`;
    }
    if (request.query.lon) {
        url += `&lon=${xss(request.query.lon)}`;
    }
    if (request.query.start) {
        url += `&start=${xss(request.query.start)}`;
    }
    if (request.query.end) {
        url += `&end=${xss(request.query.end)}`;
    }
    let config = {
        method: 'get',
        url: url
    };

    axios(config)
        .then(function (result) {
            response.status(200).send(result.data);
        })
        .catch(function (error) {
            if (error.response) {
                response.status(error.response.status).send(error.response.data);
            } else {
                response.status(400).send(error.message);
            }
        });
}

module.exports = airPollution;
