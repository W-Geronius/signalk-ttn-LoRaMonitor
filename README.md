# signalk-ttn-LoRaMonitor
Signal K Node Server Plugin to retrieve environment data from The Things Network (ttn)

Build & deployment have not yet been setup  
limited error handling has been implemented so far

**Preliminary install instructions:**

* create directory 'signalk-ttn-LoRaMonitor' in ~.signalk/node_modules, copy code there
* disconnect pi from internet
* add '"signalk-ttn-LoRaMonitor": "^0.1.0",' as dependency in ~/.signalk/package.json  
NB: this entry will disappear once the plugin is up and running 
* configure & enable plugin within Signalk
