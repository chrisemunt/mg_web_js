# mg\_web\_js

A JavaScript server for **mg\_web**.

Chris Munt <cmunt@mgateway.com>  
10 June 2024, MGateway Ltd [http://www.mgateway.com](http://www.mgateway.com)

* Current Release: Version: 1.1; Revision 2.
* [Release Notes](#relnotes) can be found at the end of this document.

Contents

* [Overview](#overview)
* [Prerequisites](#prerequisites)
* [mg_web configuration](#config)
* [Starting the server](#sstart)
* [Application code](#appcode)
* [Server-sent event code](#ssecode)
* [WebSocket code](#wscode)
* [License](#license)

## <a name="overview">Overview</a>

**mg\_web\_js** is a JavaScript server for [mg\_web](https://github.com/chrisemunt/mg_web/).  This server completely replaces the functionality that would otherwise be provided by the DB Server based superserver [mgsi](https://github.com/chrisemunt/mgsi/).

**mg\_web** provides a high-performance minimalistic interface between three popular web servers ( **Microsoft IIS**, **Apache** and **Nginx** ) and M-like DB Servers ( **YottaDB**, **InterSystems IRIS** and **Cache** ).  It is compliant with HTTP version 1.1 and 2.0 and WebSockets are supported.  **mg\_web** can connect to a local DB Server via its high-performance API or to local or remote DB Servers via the network.

## <a name="prerequisites">Prerequisites</a>

* **mg\_web**.  The **mg\_web** package can be downloaded from [here](https://github.com/chrisemunt/mg_web/).

* A supported web server.  Currently **mg\_web** supports **Microsoft IIS**, **Apache** and **Nginx**.

* A database. InterSystems **Cache/IRIS** or **YottaDB** (or similar M DB Server):
	*	https://www.intersystems.com/
	*	https://yottadb.com/

## <a name="config">mg_web configuration</a>

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

Web requests with a path of **/mgweb/js** will be routed to **application.mjs** for processing.  The handler function in **application.mjs** takes the following form and will be described in more detail in a later section.

     let handler = function(web_server, cgi, content, sys) {
       // Process HTTP web request and return response
       return result;
     }
     export {handler};

### Define a mapping to a JavaScript WebSocket application

In the package there is an example WebSocket module named **websocket.mjs**.  This can be defined in the **mg\_web** configuration as follows:

     <location /mgweb/js>
       function ./application.mjs
       websocket websocket.mgw ./websocket.mjs
       servers NodeJS
     </location>

This WebSocket application can be invoked from the client using:

     ws = new WebSocket(((window.location.protocol == "https:") ? "wss:" : "ws:") + "//" + window.location.host + "/mgweb/js/websocket.mgw");

The handler function in **websocket.mjs** takes the following form and will be described in more detail in a later section.

     let handler = function(websocket_server, cgi, content, sys) {
       // Server-side of the websocket
       return "";
     }
     export {handler};

## <a name="sstart">Starting the server</a>

An example, showing how to start the server to listen on a particular TCP port is given in the **/example/server.mjs** module.  Using this module, the server is started as follows: 

     node server.mjs

Contents of server.mjs:

     import {mg_web} from 'mg_web_js';

     mg_web({
       port: 7777
     });

This will start the server listening on TCP port 7777.  Modify this file if you wish to use an alternative TCP port.

## <a name="appcode">Application code</a>

The handler function in the application takes the following form:

     let handler = function(web_server, cgi, content, system) {
       // Process HTTP web request and return response
       return result;
     }
     export {handler};

Where:

* **web\_server**: Methods and properties related to the hosting web server.
* **cgi**: List of CGI Environment Variables.
* **content**: The request payload (if any).
* **system**: Read-only system array reserved for **mg\_web\_js** use.

There are two methods for returning a response to the client via **mg\_web** and the hosting web server.  You can generate a complete response (including a HTTP response header) as a single string.  Alternatively, responses involving large volumes of data can be streamed to the client.

### Returning a complete response as a string

     let handler = function(web_server, cgi, content, system) {
       //
       // Create HTTP response headers
       let result = "HTTP/1.1 200 OK\r\n";
       result = result + "Content-type: text/html\r\n";
       result = result + "\r\n";
       //
       // Add the HTML content
       result = result + "<html>\r\n";
       result = result + "<head><title>\r\n";
       result = result + "Hello World\r\n";
       result = result + "</title></head>\r\n";
       result = result + "<h1>Hello World</h1>\r\n";
       return result;
     }


### Streaming a response

Response data can be incrementally streamed back to the client using the **write** method:

     web_server.write(<data>);

Where:

* **data**: Data string to be sent.

Example:

     let handler = function(web_server, cgi, content, system) {
       //
       // Create HTTP response headers
       let result = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\n";
       //
       // Return CGI environment variables
       //
       cgi.forEach((value, name) => {
         result = result + "CGI variable " + name + " : " + value + "\r\n";
       });
       //
       // Stream back what we have so far
       //
       web_server.write(result);
       //
       // Stream back the request data
       //
       web_server.write("Request payload: " + content.toString());
       //
       // return with a final message
       //
       result = "\r\n*** End of Response ***\r\n";
       return result;
     }

## <a name="ssecode">Server-sent event code</a>

When the client requests a SSE channel, the web_server **sse** property will be set to **true**.  The SSE channel should be initialised by calling the **initsse** method.

     web_server.initsse(system, <options>);

Where:

* **options**: Reserved for future use.

Data is dispatched to the client using the **write** method.

     web_server.write(<data>);

Where:

* **data**: Data string to be sent.

The SSE server can close the channel using the **close** method.

     web_server.close();

Example:

    let handler = function(web_server, cgi, content, system) {
      if (web_server.sse === true) {
        //
        // Initialise SSE server
        //
        let result = web_server.initsse(sys, "");
        let n = 0;
        let d = 0;
        var intervalId = setInterval(function () {
          n ++;
          d = new Date();
          //
          // Write some data to the client
          //
          web_server.write('data: SSE data line ' + n + ' Date: ' + d.toLocaleString() + '\r\n\r\n');
          //
          // Close channel after 10 data items have been dispatched
          //
          if (n > 9) {
            clearInterval(intervalId);
            web_server.close();
          }
        }, 5000);
        return result;
      }


The above simple example sends a line of data to the client every 5 seconds and closes the channel after the tenth line has been sent.

## <a name="wscode">WebSocket code</a>

The handler function in the WebSocket application takes the following form:

     let handler = function(websocket_server, cgi, content, sys) {
       // Server-side of the websocket
       return "";
     }
     export {handler};

* **websocket\_server**: Methods and properties related to the WebSocket opened by the hosting web server.
* **cgi**: List of CGI Environment Variables.
* **content**: The request payload (if any).
* **system**: Read-only system array reserved for **mg\_web\_js** use.

The first task is to create a WebSocket client class containing a read method for accepting incoming data from the client.

       class websocket_client {
         read(websocket_server, data) {
           // process the data received from the client in 'data'
         }
       }

The WebSocket channel should be initialised by calling the initialisation method.

    websocket_server.init(system, <binary>, <options>);

Where:

* **binary**: Set to 0 for textual data; 1 for binary data.
* **options**: Reserved for future use.

Now create an instance of the WebSocket client class and register it in the **websocket\_server**.

      websocket_server.client = new websocket_client();


Having completed these initial tasks, the WebSocket server is ready for use. Data is dispatched to the client using the **write** method.

     websocket_server.write(<data>);

Where:

* **data**: Data string (or array of binary data) to be sent.

The WebSocket server can close the channel using the **close** method.

     websocket_server.close();

Example:

     let handler = function (websocket_server, cgi, content, sys) {

       // Define a class to represent client data
       class websocket_client {

         // Mandatory read method to accept client data 
         read(websocket_server, data) {
           let d = new Date();
           // Acknowledge data from client
           websocket_server.conn.write('Data received from Client: ' + data + ' at: ' + d.toLocaleString());
         }
       }

       // Initialise server side
       websocket_server.init(sys, 0, "");

       // Create instance of client class for this WebSocket connection
       websocket_server.client = new ws_client();

       // Send inital message to client
       websocket_server.write('Hello from Server');

       return "";
     }

This simple example echoes back data received from the client with the date and time appended.

## <a name="license">License</a>

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

### v1.1.2 (10 June 2024)

* Introduce support for Server-Sent Events (SSE).