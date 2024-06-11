//
//   ----------------------------------------------------------------------------
//   | Package:     mg_web_js                                                   |
//   | OS:          Unix/Windows                                                |
//   | Description: JavaScript server for mg_web                                |
//   | Author:      Chris Munt cmunt@mgateway.com                               |
//   |                         chris.e.munt@gmail.com                           |
//   | Copyright(c) 2023 - 2024 MGateway Ltd                                    |
//   | Surrey UK.                                                               |
//   | All rights reserved.                                                     |
//   |                                                                          |
//   | http://www.mgateway.com                                                  |
//   |                                                                          |
//   | Licensed under the Apache License, Version 2.0 (the "License"); you may  |
//   | not use this file except in compliance with the License.                 |
//   | You may obtain a copy of the License at                                  |
//   |                                                                          |
//   | http://www.apache.org/licenses/LICENSE-2.0                               |
//   |                                                                          |
//   | Unless required by applicable law or agreed to in writing, software      |
//   | distributed under the License is distributed on an "AS IS" BASIS,        |
//   | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
//   | See the License for the specific language governing permissions and      |
//   | limitations under the License.                                           |
//   |                                                                          |
//   ----------------------------------------------------------------------------
//

import net from 'node:net';
import os from 'node:os';
import process from 'node:process';
import child_process from 'node:child_process'

const cpus = os.cpus().length;

const MGWEB_VERSION_MAJOR = 1;
const MGWEB_VERSION_MINOR = 1;
const MGWEB_VERSION_BUILD = 2;

function mg_web(options) {

  options = options || {};
  let port = options.port || 7041;

  console.log('mg_web server version %d.%d.%d for Node.js %s; CPUs=%d; pid=%d;', MGWEB_VERSION_MAJOR, MGWEB_VERSION_MINOR, MGWEB_VERSION_BUILD, process.version, cpus, process.pid);
  let server = net.createServer();
  let workers = new Map();

  process.on( 'SIGINT', async function() {
    console.log('*** CTRL & C detected: shutting down gracefully...');

    if (workers.size > 0) {
      for (const [key, worker] of workers) {
        console.log('signalling worker ' + worker.pid + ' to stop: key = ' + key);
        worker.send('<<stop>>');
        workers.delete(key);
      }
      setTimeout(() => {
        process.exit();
      }, 1000);
    }
    else {
      process.exit();
    }
  });

  server.on('connection', (conn) => {    
    let remote_address = conn.remoteAddress + ':' + conn.remotePort;  
    console.log('mg_web new client connection from %s', remote_address);

    conn.on('data', (d) => {
      let dirname = import.meta.dirname;
      if (dirname === undefined) {
        dirname = '.';
      }
      let worker = child_process.fork(dirname + '/mg_web_js_child.mjs', [], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });

      workers.set(worker.pid, worker);

      worker.on('message', message => {
        if (message === 'ready!') {
          worker.send(d, conn);
          return;
        }

        if (message === 'stopping') {
          console.log('master process removing stopped worker from Map');
          workers.delete(worker.pid);
        }

      });
    });
  });

  server.listen(port, () => {    
    console.log('mg_web server listening on %j;', server.address());  
  });

}

export {mg_web};

