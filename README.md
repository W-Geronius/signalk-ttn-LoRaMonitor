# signalk-ttn-LoRaMonitor
Signal K Node Server Plugin to retrieve environment data from The Things Network (ttn)

Build & deployment have not yet been setup  

v.0.1.2

**Preliminary install instructions:**

* create directory 'signalk-ttn-LoRaMonitor' in ~/.signalk/node_modules, copy code there  
including the node_modules directory
* copy signalk-ttn-LoRaMonitor.json to ~/.signalk/plugin-config-data  
* restart SignalK server

If the plugin doesn't show up as 'ttn LoRa Monitoring' at the SignalK server's Plugin Config page, try following steps:

* disconnect pi from internet  
add '"signalk-ttn-LoRaMonitor": "^0.1.0",' as dependency in ~/.signalk/package.json  
NB: this entry will disappear once the plugin is up and running with internet connected

* configure & enable plugin within Signalk
* enjoy and report issues!
