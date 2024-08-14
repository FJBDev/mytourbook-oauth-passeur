function define(name, value) {
    Object.defineProperty(exports, name, {
        value: value,
        enumerable: true
    });
}

define("suuntoBaseUrl", 'https://cloudapi.suunto.com/v2/');


/*
TODO FB segregate the suunto route upload and file download to separate file

 Segregate the strava endpoints

 Unit tests for the workout import (using mock?)

 */