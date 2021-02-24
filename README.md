# signalk-ttn-LoRaMonitor
Signal K Node Server Plugin to retrieve environment data from The Things Network (ttn)

This plugin has been developed to import data to SignalK as transmitted by the Open Boat Project's  [**'LoRa Boat Monitor'**](https://open-boat-projects.org/en/lora-bootsmonitor/ "click to read more")
Presently this plugin only supports a single sensor to be placed on the vessel for remote monitoring.

Further releases may also support:

* multiple devices (same payload data structure)
* multiple devices (different payload data structures)
* user definable payload definitions to be decoded at client side

**The project is considered as 'beta'**

Current version: v.0.2.2b

PR welcome. 
To discuss, please visit german [**Segeln-Forum.de**](https://www.segeln-forum.de/board194-boot-technik/board195-open-boat-projects-org/74840-lora-monitoring-und-alarmserver/#post2124488), posting in english is accepted

**Preliminary install instructions:**

* create directory 'signalk-ttn-LoRaMonitor' in ~/.signalk/node_modules, copy code there  
including the node_modules directory
* copy signalk-ttn-LoRaMonitor.json to ~/.signalk/plugin-config-data
* configure & enable plugin within Signalk
* enjoy and report issues!

> If the plugin doesn't show up as 'ttn LoRa Monitoring' at the SignalK server's Plugin Config page, try following steps:
> * disconnect pi from internet  
> add '"signalk-ttn-LoRaMonitor": "^0.1.0",' as dependency in ~/.signalk/package.json  
> This entry will disappear once the plugin is up and running with internet connected

