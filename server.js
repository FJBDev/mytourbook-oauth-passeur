var PORT = process.env.PORT || 5000;
var express = require('express');
var axios = require('axios');
var qs = require('qs');
const xss = require('xss-clean');
var app = express();
const bodyParser = require('body-parser')
app.use(bodyParser.json({ limit: '50mb', extended: true }));// for parsing application/json
const { AuthorizationCode } = require('simple-oauth2');

const openWeatherMapTimeMachine = require('./app/openweathermap-timemachine.js');
const openWeatherMapAirPollution = require('./app/openweathermap-airpollution.js');

const { initializeUpload, getUploadStatus } = require('./app/suunto-workoutupload.js');
var suuntoConstants = require("./suunto-constants");

// sanitize request data
app.use(xss());

app.listen(PORT, () => {
  console.log(`Currently listening to any requests from MyTourbook`);
})

app.get('/', async (request, response) => {
  response.redirect('http://mytourbook.sourceforge.net/mytourbook/');
})

const stravaClient = new AuthorizationCode({
  client: {
    id: process.env.STRAVA_CLIENT_ID,
    secret: process.env.STRAVA_CLIENT_SECRET
  },
  auth: {
    tokenHost: 'https://www.strava.com/api/v3'
  },
  options: {
    authorizationMethod: 'body'
  }
});

app.post("/strava/token", async (request, response) => {
  const { code, refresh_token, grant_type } = request.body;

  const tokenResponse = await retrieveStravaToken(grant_type, code, refresh_token);

  if (tokenResponse == null) {
    response.status(400).send();
    return;
  }

  let tokenCopy = JSON.parse(JSON.stringify(tokenResponse));
  tokenCopy.expires_at = tokenResponse.token.expires_at.getTime().toString();

  response.status(201).send(tokenCopy);
})

app.post("/suunto/token", async (request, response) => {

  const { code, refresh_token, grant_type } = request.body;

  const suuntoCallbackUrl = 'http://localhost:4919';

  var data = qs.stringify({
    'grant_type': grant_type,
    'code': code,
    'redirect_uri': suuntoCallbackUrl,
    'refresh_token': refresh_token
  });

  var clientId = process.env.SUUNTO_CLIENT_ID;
  var clientSecret = process.env.SUUNTO_CLIENT_SECRET;
  var authorizationHeader = 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64');
  var config = {
    method: 'post',
    url: 'https://cloudapi-oauth.suunto.com/oauth/token',
    headers: {
      'Authorization': authorizationHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data,
  };

  axios(config)
    .then(function (result) {
      response.status(201).send(result.data);
    })
    .catch(function (error) {
      if (error.response) {
        response.status(error.response.status).send(error.message);
      } else {
        response.status(400).send(error.message);
      }
    });
})

app.post("/suunto/route/import", async (request, response) => {

  const { authorization } = request.headers;

  var config = {
    method: 'post',
    url: suuntoConstants.suuntoBaseUrl + + '/route/import',
    headers: {
      'Authorization': authorization,
      'Content-Type': 'application/gpx+xml',
      'Ocp-Apim-Subscription-Key': process.env.SUUNTO_SUBSCRIPTION_KEY
    },
    data: Buffer.from(request.body.gpxRoute, "base64").toString()
  };

  axios(config)
    .then(function (result) {
      response.status(201).send(result.data);
    })
    .catch(function (error) {
      if (error.response) {
        response.status(error.response.status).send(error.message);
      } else {
        response.status(400).send(error.message);
      }
    });
})

app.get("/suunto/workouts", async (request, response) => {

  const { authorization } = request.headers;

  var url = suuntoConstants.suuntoBaseUrl + '/workouts?limit=10000&filter-by-modification-time=false';
  if (request.query.since) {
    url += '&since=' + request.query.since;
  }
  if (request.query.until) {
    url += '&until=' + request.query.until;
  }

  var config = {
    method: 'get',
    url: url,
    headers: {
      'Authorization': authorization,
      'Ocp-Apim-Subscription-Key': process.env.SUUNTO_SUBSCRIPTION_KEY
    }
  };

  axios(config)
    .then(function (result) {
      response.status(200).send(result.data);
    })
    .catch(function (error) {
      if (error.response) {
        response.status(error.response.status).send(error.message);
      } else {
        response.status(400).send(error.message);
      }
    });
})

app.get("/suunto/workout/exportFit", async (request, response) => {

  const { authorization } = request.headers;

  var url = suuntoBaseUrl + '/workout/exportFit/' + request.query.workoutKey;

  var config = {
    method: 'get',
    url: url,
    headers: {
      'Authorization': authorization,
      'Ocp-Apim-Subscription-Key': process.env.SUUNTO_SUBSCRIPTION_KEY
    },
    responseType: 'arraybuffer',
    responseEncoding: 'binary'
  };

  const contentDisposition = 'content-disposition';
  axios(config)
    .then(function (result) {
      response.setHeader(contentDisposition, result.headers[contentDisposition]);

      response.status(200).send(result.data);
    })
    .catch(function (error) {
      if (error.response) {
        response.status(error.response.status).send(error.message);
      } else {
        response.status(400).send(error.message);
      }
    });
})

async function retrieveStravaToken(grantType, code, refreshToken) {
  options = {
    code: code,
    refresh_token: refreshToken,
    grant_type: grantType
  };

  try {

    const tokenResponse = await stravaClient.getToken(options);

    return tokenResponse;
  } catch (error) {
    console.error('Access Token Error', error.message);
  }
}

app.use("/openweathermap/timemachine", async (request, response) => openWeatherMapTimeMachine(request, response));
app.use("/openweathermap/air_pollution", async (request, response) => openWeatherMapAirPollution(request, response));

app.post("/suunto/workout/upload", async (request, response) => initializeUpload(request, response));
app.get("/suunto/workout/upload/:Id", async (request, response) => getUploadStatus(request, response));

app.get("/weatherapi", async (request, response) => {

  const weatherApiBaseUrl = 'http://api.weatherapi.com/v1/history.json';
  var url = weatherApiBaseUrl + '?key=' + process.env.WEATHERAPI_KEY;

  if (request.query.lat) {
    url += '&q=' + request.query.lat;
  }
  if (request.query.lon) {
    url += ',' + request.query.lon;
  }
  if (request.query.dt) {
    url += '&dt=' + request.query.dt;
  }
  if (request.query.end_dt) {
    url += '&end_dt=' + request.query.end_dt;
  }
  if (request.query.lang) {
    url += '&lang=' + request.query.lang;
  }

  var config = {
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
})

module.exports = app;