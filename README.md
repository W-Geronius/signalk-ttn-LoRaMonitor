# signalk-ttn-LoRaMonitor
Signal K Node Server Plugin to retrieve environment data from The Things Network (ttn)

Build & deployment have not yet been setup
Zero error handling implemented so far

Preliminary install instructions:

1.) create directory 'signalk-ttn-LoRaMonitor' in ~.signalk/node_modules, copy code there

2.) disconnect pi from internet

3.) add '"signalk-ttn-LoRaMonitor": "^0.1.0",' as dependency in ~/.signalk/package.json NB: this entry will disappear once the plugin is up and running 

4.) configure & enable plugin within Signalk
