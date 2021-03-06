# Requirements and Installation

* MongoDB, InfluxDB, Neo4j
* Node.js (tested with v4.x)

`./runInstall.sh`

# Start

To start the infrastructure as a single process execute `api/index.js` with node.

`node ./api/index.js`

# Environment variables

To load the environment variables, a module called [dotenv](https://github.com/motdotla/dotenv) is used.

* DB_HOST: MongoDB host, default `localhost`
* DB_PORT: MongoDB port, default `27017`
* DB_NAME: MongoDB database name, default: `test`
* INFLUXDB_HOST: default `localhost`
* INFLUXDB_PORT: default `8086`
* INFLUXDB_PROTOCOL: default `http`
* INFLUXDB_USERNAME: default `dbuser`
* INFLUXDB_PASSWORD: default `f4ncyp4ass`
* INFLUXDB_DATABASENAME: `development`
* NEO4J_HOST: default `localhost`
* NEO4J_USERNAME: `neo4j`
* NEO4J_PASSWORD: `mypassword`

The MIT License (MIT)

Copyright (c) 2014 Timo Weiß

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
