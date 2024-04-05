# mg\_web\_js

A JavaScript server for **mg\_web**.

Chris Munt <cmunt@mgateway.com>  
5 April 2024, MGateway Ltd [http://www.mgateway.com](http://www.mgateway.com)

* Current Release: Version: 1.0; Revision 1a.
* [Release Notes](#relnotes) can be found at the end of this document.

## Overview

**mg\_web\_js** is a JavaScript server for [mg\_web](https://github.com/chrisemunt/mg_web/).  This server completely replaces the functionality that would otherwise be provided by the DB Server based superserver [mgsi](https://github.com/chrisemunt/mgsi/).

**mg\_web** provides a high-performance minimalistic interface between three popular web servers ( **Microsoft IIS**, **Apache** and **Nginx** ) and M-like DB Servers ( **YottaDB**, **InterSystems IRIS** and **Cache** ).  It is compliant with HTTP version 1.1 and 2.0 and WebSockets are supported.  **mg\_web** can connect to a local DB Server via its high-performance API or to local or remote DB Servers via the network.

## Prerequisites

* **mg\_web**.  The **mg\_web** package can be downloaded from [here](https://github.com/chrisemunt/mg_web/).

* A supported web server.  Currently **mg\_web** supports **Microsoft IIS**, **Apache** and **Nginx**.

* A database. InterSystems **Cache/IRIS** or **YottaDB** (or similar M DB Server):
	*	https://www.intersystems.com/
	*	https://yottadb.com/

## Starting the server

An example, showing how to start the server to listen on a particular TCP port is given in the **/example/server.mjs** module.  Using this module the server is started as follows: 

     node server.mjs

## mg_web configuration

This section will describe how to configure **mg\_web** to communicate with the JavaScript server (**mg\_web\_js**) as opposed to the DB Server based **mgsi** superserver.

For JavaScript, the server type should be defined as **Node.js** in the **mg\_web** configuration file (**mgweb.conf**).  For example:

     <server NodeJS>
       type Node.JS
       host 127.0.0.1
       tcp_port 7777
     </server>

### Define a mapping to your JavaScript application

In the package there is an example application module named **application.mjs**.  This can be defined in the **mg\_web** configuration as follows:

     <location /mgweb/js>
       function ./application.mjs
       servers NodeJS
     </location>

Web requests with a path of **/mgweb/js** will be routed to **application.mjs** for processing.

### Define a mapping to a JavaScript websocket application

In the package there is an example websocket module named **websocket.mjs**.  This can be defined in the **mg\_web** configuration as follows:

     <location /mgweb/js>
       function ./application.mjs
       websocket websocket.mgw ./websocket.mjs
       servers NodeJS
     </location>
  
This websocket application can be invoked from the client using:

     ws = new WebSocket(((window.location.protocol == "https:") ? "wss:" : "ws:") + "//" + window.location.host + "/mgweb/js/websocket.mgw");

## License

Copyright (c) 2019-2024 MGateway Ltd,
Surrey UK.                                                      
All rights reserved.

http://www.mgateway.com                                                  
Email: cmunt@mgateway.com
 
 
Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.      

## <a name="relnotes"></a>Release Notes

### v1.0.1 (4 April 2024)

* Initial Release

### v1.0.1a (5 April 2024)

* Add some configuration notes to this README file.