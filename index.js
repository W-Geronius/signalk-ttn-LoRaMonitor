/*
 * Copyright 2021 M.Satzinger <w.geronius@web.de>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
  
   v.0.1.0   beta: inital working script

build NPM package:
https://www.stefanjudis.com/today-i-learned/npm-install-supports-local-packages/

*/

const _ = require('lodash');
const ms = require('ms');
const debug = require('debug')('signalk-ttn-LoRaMonitor')
const spawn = require('child_process').spawn;
const curl_cmd1 = 'curl -s -X GET --header \'Accept: application/json\' --header \'Authorization: key ';
const curl_cmd2 = '\' \'https://';
const curl_cmd3 = '.data.thethingsnetwork.org/api/v2/query/';
const curl_cmd4 = '?last=';
const curl_cmd5 = '\' | sed \'s:},{:},\\r\\n{:g\' | tail -n 1';

const msg_null = "No data available since server start";
const msg_Data = "Data received as of ";
var Message = msg_null;

module.exports = function (app) {
  var plugin = {};
  var timer;
  plugin.id = "signalk-ttn-LoRaMonitor";
  plugin.name = "ttn LoRa Monitoring";
  plugin.description = "Signal K Node Server Plugin to retrieve values from ttn";

  // TODO rework & validate config entries
  plugin.schema = {
    type: "object",
    description: "Make sure you have properly setup and checked your LoRa Device at thethingsnetwork.org",
    properties: {
      ttn_account: {
        title: "ttn account name",
        type: "string",

      },
      ttn_device: {
        title: "device name",
        type: "string",

      },
      ttn_authKey: {
        title: "ttn Authorization Key",
        minLength: 50,
        maxLength: 65,
        type: "string",
        default: "ttn-account-v2.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      },
      // TODO: eingabe mit ms prüfen, min 1000ms, max 604800000       
      ttn_period: {
        title: "Age of dataset you wish to receive - (last entry is used)  should exceed your device's send frequency (seconds, 1m, 1h, 1d ...)",
        type: "string",
        // enum: ['1m', '5m', '30m', '1h'],
        default: "5m",
      },

      // TODO modify paths to device 1-12 char, SK path fixed
      // https://github.com/SignalK/signalk-server/blob/master/SERVERPLUGINS.md#ui-schema

      path_dewpoint: {
        title: "SignalK Path for dewpoint (K)",
        minLength: 20,
        maxLength: 65,
        type: "string",
        default: "environment.inside.LoRa.dewPoint",
      },
      path_humidity: {
        title: "SignalK Path for humidity (ratio)",
        type: "string",
        default: "environment.inside.LoRa.relativeHumidity",
      },
      path_position: {
        title: "SignalK Path for position",
        type: "string",
        default: "environment.inside.LoRa.position",
      },
      path_pressure: {
        title: "SignalK Path for pressure (Pa)",
        type: "string",
        default: "environment.inside.LoRa.pressure",
      },
      path_raw: {
        title: "SignalK Path for sensor raw data (text)",
        type: "string",
        default: "environment.inside.LoRa.raw",
      },
      path_temp_ext: {
        title: "SignalK Path for temperature external (K)",
        type: "string",
        default: "environment.inside.LoRaExt.temperature",
      },
      path_temperature: {
        title: "SignalK Path for temperature (K)",
        type: "string",
        default: "environment.inside.LoRa.temperature",
      },
      path_timestamp: {
        title: "SignalK Path for device timestamp",
        type: "string",
        default: "environment.inside.LoRa.timestamp",
      },
      path_voltage: {
        title: "SignalK Path for voltage (V)",
        type: "string",
        default: "electrical.batteries.service.voltage",
      }
    }
  };

  plugin.statusMessage = function () {
    return `${Message}`
  }
  plugin.start = function (options) {

    function updateEnv() {
      getTtnData();
    }

    function getTtnData() {

      // TODO: modify to get data by JS


      // method 1 via shell: 
      // proper error handling check at \usr\lib\node_modules\signalk-server\node_modules\@signalk\set-system-time
      var curl_cmd = curl_cmd1 + options.ttn_authKey + curl_cmd2;
      curl_cmd = curl_cmd + options.ttn_account + curl_cmd3;
      curl_cmd = curl_cmd + options.ttn_device + curl_cmd4;
      curl_cmd = curl_cmd + '1m' + curl_cmd5;
      // app.debug('issuing: ' + curl_cmd); 

      // method 2 via js https request, preferred
      // https://nodejs.org/en/knowledge/HTTP/clients/how-to-create-a-HTTP-request/

      var ttnData = spawn('sh', ['-c', curl_cmd]);
      ttnData.stdout.on('data', (data) => {

        app.debug(_.trunc(data, 50));

        // app.setPluginError ('No data received, check if this state persists');
        if (!_.startsWith(data, '[')) data = '[' + data;

        ttn_JSON = JSON.parse(data);
        var counter = 0;
        var dewpoint = _.round((ttn_JSON[counter].dewpoint + 273.15), 2)
        if (dewpoint > 600) dewpoint = null;
        var humidity = _.round(0.01 * ttn_JSON[counter].humidity, 2);
        var position = ttn_JSON[counter].position;
        var pressure = 100 * ttn_JSON[counter].pressure;
        var raw = ttn_JSON[counter].raw;
        var temp_ext = _.round((ttn_JSON[counter].tempbattery + 273.15), 2);
        if (temp_ext > 300) temp_ext = null;
        var temperature = _.round((ttn_JSON[counter].temperature + 273.15), 2);
        if (temperature > 300) temperature = null;
        var timestamp = ttn_JSON[counter].time;
        var voltage = ttn_JSON[counter].voltage;

        Message = msg_Data + _.trunc(timestamp,22);

        app.handleMessage(plugin.id, {
          updates: [
            {
              '$source': 'ttn.' + options.ttn_device,
              values: [
                { path: options.path_dewpoint, value: dewpoint },
                { path: options.path_humidity, value: humidity },
                { path: options.path_position, value: position },
                { path: options.path_pressure, value: pressure },
                { path: options.path_raw, value: raw },
                { path: options.path_temp_ext, value: temp_ext },
                { path: options.path_temperature, value: temperature },
                { path: options.path_timestamp, value: timestamp },
                { path: options.path_voltage, value: voltage }
              ]
            }
          ]
        })
      }
      )

      ttnData.on('error', (error) => {
        app.error(error.toString('error error'));
      })

      ttnData.on('data', function (data) {
        app.error(data.toString('data error'));
      })
    }

    var ms_period = ms(options.ttn_period)
    if (ms(options.ttn_period) > ms('7d')) {
      ms_period = ms('7d');
    } else {
      if (ms(options.ttn_period) < 0) {
        ms_period = 0
      }
    }

    updateEnv();
    setInterval(updateEnv, ms_period);
  }

  plugin.stop = function () {
    if (timer) {
      clearInterval(timer);
      timer = null
    }
  }
  return plugin
}
