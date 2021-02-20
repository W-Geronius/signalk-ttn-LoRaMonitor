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
  
   v.0.1.0   alpha: inital working script
   v.0.1.1   alpha: error handling added
   v.0.1.2   beta: paths restricted to valid SK schema names
   v.0.2.0   beta: get data via http.get, minor fixes
   v.0.2.1   beta: improved error handling, extended options validation

TODO: build NPM package
https://www.stefanjudis.com/today-i-learned/npm-install-supports-local-packages/

*/
const { notDeepEqual } = require('assert');
const _ = require('lodash');
const ms = require('ms');
const debug = require('debug')('signalk-ttn-LoRaMonitor');

const msg_null = "No data available since server start";
const msg_Data = "Data received as of ";
const path_env = "environment.inside.";
const path_bat = "electrical.batteries.";


module.exports = function (app) {
  var plugin = {};
  var timer;
  var Message = msg_null;
  var lastValid;

  plugin.id = "signalk-ttn-LoRaMonitor";
  plugin.name = "ttn LoRa Monitoring";
  plugin.description = "Signal K Node Server Plugin to retrieve values from ttn";
  /*
  *** description of config parms
  *** minLength not working !
  */
  plugin.schema = {
    type: "object",
    required: ['ttn_account', 'ttn_device', 'ttn_authKey', 'ttn_period', 'path_envInt', 'path_envExt', 'path_Batt'],
    description: "Make sure you have properly setup and checked your LoRa Device at thethingsnetwork.org",
    properties: {
      // TTN account info      
      ttn_account: {
        title: "ttn account name",
        type: "string",
        default: "myAccount",
        pattern: '^[a-zA-Z0-9_\-]+$',
        minLength: 1,
        maxLength: 20,
      },
      ttn_device: {
        title: "device name",
        type: "string",
        default: "myDevice",
        pattern: '^[a-zA-Z0-9_\-]+$',
        minLength: 1,
        maxLength: 20,
      },
      ttn_authKey: {
        title: "ttn Authorization Key",
        type: "string",
        default: "ttn-account-v2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        pattern: '^ttn-account-v2.[a-zA-Z0-9]+$',
        minLength: 58,
        maxLength: 60
      },
      ttn_period: {
        title: "Age of dataset you wish to retrieve - (first entry is used) --- should match your device's send frequency (e.g. 10s, 1m, 1h, 1d)",
        type: "string",
        pattern: '^[smhd0-9]+$',
        default: "5m",
      },
      // SK path details
      path_envInt: {
        title: "SignalK environment.inside instance ID for data (boxed) --- Length: 1-12, valid characters: (a-z, A-Z, 0-9)",
        minLength: 1,
        maxLength: 12,
        type: "string",
        pattern: '^[a-zA-Z0-9]+$',
        default: "LoRaBox",
      },
      path_envExt: {
        title: "SignalK environment.inside instance ID for data --- Length: 1-12, valid characters: (a-z, A-Z, 0-9)",
        minLength: 1,
        maxLength: 12,
        type: "string",
        pattern: '^[a-zA-Z0-9]+$',
        default: "LoRa",
      },
      path_batt: {
        title: "SignalK electrical.batteries instance ID for voltage --- Length: 1-12, valid characters: (a-z, A-Z, 0-9)",
        minLength: 1,
        maxLength: 12,
        type: "string",
        pattern: '^[a-zA-Z0-9]+$',
        default: "service",
      },
    }
  }
  /*
  *** Dashboard Status Message
  */
  plugin.statusMessage = function () {
    return `${Message}`
  }
  /*
  *** Execution
  */
  plugin.start = function (options) {
    function updateEnv() {
      getTtnData()
    }

    function getTtnData() {

      const https = require('https');
      var httpRequest = {
        hostname: options.ttn_account + '.data.thethingsnetwork.org',
        path: '/api/v2/query/' + options.ttn_device + '?last=' + options.ttn_period,
        headers: {
          Accept: 'application/json',
          Authorization: 'key ' + options.ttn_authKey
        }
      }
      /*
      *** retrieve data data from ttn
      */
      var request = https.get(httpRequest, function (response) {
        var result = '';
        response.on('data', function (chunk) { result += chunk });
        response.on('end', function () {
          app.debug('\'' + result + '\'');
          /*
          *** check for unexpected or incomplete results
          */
          {
            if (!_.startsWith(result, '[')) result = '[' + result;
            if (!_.endsWith(_.trim(result), '}]' || !_.startsWith(result, '[{'))) {
              if (lastValid !== undefined) {
                app.setPluginError('invalid data received, latest valid at: ' + _.trunc(lastValid, 22))
              } else { app.setPluginError('invalid data received') }
              if (!_.isString(result)) { app.error('invalid : [' + result + ']') } else { app.error(' empty result') };
              return
            }
          }
          /*
          *** Parse, correct and convert fields to SK units
          */
          {
            ttn_JSON = JSON.parse(result);
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
            if (_.isString(timestamp)) { lastValid = timestamp }
            var voltage = ttn_JSON[counter].voltage;
            voltage += 1
            Message = msg_Data + _.trunc(timestamp, 22);
          }
          /*
          *** assemble delta
          */
          app.handleMessage(plugin.id, {
            updates: [
              {
                '$source': 'ttn.' + options.ttn_device,
                values: [
                  { path: path_env + options.path_envInt + '.dewPoint', value: dewpoint },
                  { path: path_env + options.path_envInt + '.relativeHumidity', value: humidity },
                  { path: path_env + options.path_envExt + '.position', value: position },
                  { path: path_env + options.path_envExt + '.pressure', value: pressure },
                  { path: path_env + options.path_envInt + '.raw', value: raw },
                  { path: path_env + options.path_envInt + '.temperature', value: temperature },
                  { path: path_env + options.path_envExt + '.temperature', value: temp_ext },
                  { path: path_env + options.path_envExt + '.timestamp', value: timestamp },
                  { path: path_bat + options.path_batt + '.voltage', value: voltage }
                ]
              }
            ]
          })
        })
      }).on('error', () => {
        if (lastValid !== undefined) {
          app.setPluginError('Internet error, latest valid at: ' + _.trunc(lastValid, 22))
        } else { app.setPluginError('Internet error') }
        return
      });
    }
    {   // timer valid from 10 seconds to 7 days
      var ms_period = ms(options.ttn_period)
      if (ms(options.ttn_period) > ms('7d')) ms_period = ms('7d');
      if (ms(options.ttn_period) < '10s') ms_period = ms('10s');
    }
    updateEnv();
    setInterval(updateEnv, ms_period);
  }
  /*
  *** Cleanup
  */
  plugin.stop = function () {
    if (isFinite(timer)) {
      clearInterval(timer);
      timer = null
    }
  }
  return plugin
}