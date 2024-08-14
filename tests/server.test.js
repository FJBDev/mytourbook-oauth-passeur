let app = require('../server');
const supertest = require('supertest');
const requestWithSupertest = supertest(app);
let nock = require('nock');
let sinon = require('sinon');
let example = nock('https://www.strava.com/api/v3')
  .post('/strava/token')
  .reply(201, { foo: 'bar' });
const { AuthorizationCode } = require('simple-oauth2');

function getRandomArbitrary(min, max) {

  return Math.floor(Math.random() * (max - min) + min);
}

function getYesterdaysDate() {

  let yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  return yesterdayDate
}

beforeAll(() => {
  app = app.listen(getRandomArbitrary(0, 65536)); // Random number is needed to avoid using same port in different tests if you run in parallel
})

afterAll(() => {
  app.close()
})

let http = require('http');
const { assert } = require('console');
let options = {
  host: 'example.com',
  port: 80,
  path: '/strava/token',
  method: 'POST'
}
describe('OpenWeatherMap 3.0 Current Weather Retrieval', () => {

  test('GET /openweathermap should return 200', async () => {

    expect.hasAssertions();

    let dt = Math.floor(new Date().getTime() / 1000);

    const res = await requestWithSupertest.get('/openweathermap/3.0/current?units=metric&lat=40.26&lon=-105.58&dt=' + dt);

    expect(res.status).toEqual(200);
  });

});

describe('OpenWeatherMap Air Quality Retrieval', () => {

  test('GET /openweathermap should return 200', async () => {

    expect.hasAssertions();

    let yesterdayDate = getYesterdaysDate();
    let start = Math.floor(yesterdayDate.getTime() / 1000);
    let end = start + 3600;

    const res = await requestWithSupertest.get('/openweathermap/air_pollution?lat=40.26&lon=-105.58&start=' + start +
      '&end=' + end);

    expect(res.status).toEqual(200);
  });

});

describe('WeatherApi Weather Retrieval', () => {

  test('GET /weatherapi should return 200', async () => {

    expect.hasAssertions();

    let yesterdayDate = getYesterdaysDate();
    let dt = yesterdayDate.toISOString().split('T')[0];

    const res = await requestWithSupertest.get('/weatherapi?lat=40.26&lon=-105.58&dt=' + dt);

    expect(res.status).toEqual(200);
  });

});

describe('Strava Token Retrieval', () => {

  test('POST /strava/token should return 201', async () => {

    //expect.hasAssertions();
    // const spy = sinon.spy(capp, 'retrieveStravaToken');
    // jest.spyOn(app, 'retrieveStravaToken').mockImplementation(() => {
    //   return {
    //     "hikes": [
    //       {
    //         "route_id": 123,
    //         "title": "My Mocked Hike",
    //         "stats": {
    //           "startTime": "2019-10-30T16:49:40Z",
    //           "endTime": "2019-10-30T19:05:28Z"
    //         }
    //       }
    //     ]
    //   }
    // });
    //jwtSpy.mockReturnValue('Some decoded token');
    const res = await requestWithSupertest.post('/strava/token').send('{ "client_id":"client_id", "refresh_token":"refresh_token", "client_secret":"client_secret", "code":"code", "grant_type":"authorization_code" }');
    //assert(spy.called);
    console.log(res);
    expect(res.status).toEqual(200);
    // let req = http.request(options, function (res) {
    //   expect(res.tatus).toEqual(200);
    //   res.on('data', function (chunk) {
    //     console.log('BODY: ' + chunk);
    //   });
    // });

    // req.on('error', function (e) {
    //   console.log('error: ' + e);
    // });

    //req.end();
  });

});
