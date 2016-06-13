'use strict';

const neo = require('neo4j-driver').v1;

const host = process.env['NEO4J_HOST'] || 'localhost';
const user = process.env['NEO4J_USERNAME'] || 'neo4j';
const password = process.env['NEO4J_PASSWORD'] || 'mypassword';

const neoConnection = neo.driver('bolt://' + host, neo.auth.basic(user, password));

module.exports = {
    addNode,
    addServiceSystemRelation,
    getGraphBySystemId,
    findConnectedEventsAndCleanUp,
    getGraphByTraceId,
    getTracesBySystemId
};

function addNode(nodeData) {
    let session = neoConnection.session();
    let createStmt = `CREATE (:${nodeData.type} ${JSON.stringify(nodeData.values).replace(/\\"/g, "").replace(/\"([^(\")"]+)\":/g, "$1:")})`;

    return session.run(createStmt)
        .then(result => closeConnection(result, session));
}


function addServiceSystemRelation(serviceId, systemId, relationType) {
    let session = neoConnection.session();
    let relationStmt = `MATCH (service:Service {id: "${serviceId}"}) 
                        MATCH (system:System {id: "${systemId}"})
                        CREATE (service)-[:${relationType} {timestamp:${Date.now()}}]->(system)
                        ;
                        `;

    return session.run(relationStmt)
        .then(result => closeConnection(result, session));
}


function findConnectedEventsAndCleanUp() {
    let session = neoConnection.session();
    let cssrStmt = `MATCH (e1: CS)
                    MATCH (e2: SR)
                    WHERE e1.requestId = e2.requestId
                    MATCH (csService: Service {id: e1.appId})
                    MATCH (srService: Service {id: e2.appId})
                    CREATE (csService)-[:SENT_REQUEST {time: e1.timestamp, duration: e1.duration, name: e1.name, traceId: e1.traceId, requestId: e1.requestId}]->(srService)
                    DELETE e1
                    DELETE e2
                    ;
                    `;

    let sscrStmt = `MATCH (e3: SS)
                    MATCH (e4: CR)
                    WHERE e3.requestId = e4.requestId
                    MATCH (ssService: Service {id: e3.appId})
                    MATCH (crService: Service {id: e4.appId})
                    CREATE (ssService)-[:SENT_RESPONSE {time: e3.timestamp, duration: e3.duration, name: e3.name, traceId: e3.traceId, requestId: e3.requestId}]->(crService)
                    DELETE e3
                    DELETE e4
                    ;
                    `;

    let unknownSRSS = ` MATCH (e5: SR)
                        MATCH (e6: SS)
                        WHERE e5.traceId = e5.requestId AND e6.traceId = e6.requestId  AND e6.traceId = e5.traceId
                        MATCH (ssService: Service {id: e5.appId})
                        MATCH (ssService)-[:BELONGS_TO]->(system: System)
                        MATCH (uc: UnknownClient {system_id: system.id})
                        CREATE (uc)-[:SENT_REQUEST {time: e5.timestamp, duration: e5.duration, name: e5.name, traceId: e5.traceId, requestId: e5.requestId}]->(ssService)
                        CREATE (uc)<-[:SENT_RESPONSE {time: e6.timestamp, duration: e6.duration, name: e6.name, traceId: e6.traceId, requestId: e6.requestId}]-(ssService)
                        DELETE e5, e6
                        ;
                       `;

    Promise.all([session.run(cssrStmt), session.run(sscrStmt), session.run(unknownSRSS)])
        .then(result => {
            console.log('findConnectedEventsAndCleanUp success:', result);
            closeConnection(result, session)
        })
        .catch(err => console.error('findConnectedEventsAndCleanUp error:', err));
}


function getGraphBySystemId(systemId, timeFrom, timeTo) {
    let session = neoConnection.session();

    let optionalTimeToClause = timeTo ? ` AND sr.time < ${timeTo}` : '';

    let relationStmt = `MATCH (system:System)<-[:BELONGS_TO]-(sender)-[sr:SENT_REQUEST]->(receiver:Service)
                        WHERE system.id = "${systemId}"
                        WITH sender,sr,receiver
                        WHERE sr.time > ${timeFrom} ${optionalTimeToClause}
                        WITH sender,count(receiver) as numRelations, avg(sr.duration) as avgDuration, receiver
                        WHERE numRelations > 0
                        RETURN sender, numRelations, avgDuration, receiver
                        `;

    console.log(relationStmt);

    return session.run(relationStmt)
        .then(result => {
            return closeConnection(result, session)
        });
}

function getGraphByTraceId(systemId, traceId) {

    let session = neoConnection.session();

    let querySmt = `MATCH (sender:Service)-[br:BELONGS_TO]->(system:System)
                    WHERE system.id = '${systemId}'
                    MATCH (sender)-[r:SENT_REQUEST]->(receiver:Service)
                    WHERE r.traceId = '${traceId}'
                    RETURN sender, r, receiver
                    `;

    const traces = [];
    return new Promise((resolve, reject) => {
        session.run(querySmt).subscribe({
            onNext: function (record) {
                traces.push({
                    sender: record._fields[0].properties,
                    request: record._fields[1].properties,
                    receiver: record._fields[2].properties
                });
            },
            onCompleted: function () {
                console.time('getting traces | db');
                resolve(traces);
                session.close();
            },
            onError: function (error) {
                console.log(error);
                reject(error);
            }
        });
    });
}

function getTracesBySystemId(systemId) {

    let session = neoConnection.session();

    let queryStmt = `MATCH (sender:Service)-[br:BELONGS_TO]->(system:System)
                    WHERE system.id = "${systemId}"
                    MATCH (sender)-[r:SENT_REQUEST]->(receiver:Service)
                    WHERE r.traceId = r.requestId
                    RETURN sender, r, receiver
                    ORDER BY r.time DESC 
                    LIMIT 10`;

    console.time('getting traces | db');
    const traces = [];
    return new Promise((resolve, reject) => {
        session.run(queryStmt).subscribe({
            onNext: function (record) {
                traces.push({
                    sender: record._fields[0].properties,
                    request: record._fields[1].properties,
                    receiver: record._fields[2].properties
                });
            },
            onCompleted: function () {
                console.time('getting traces | db');
                resolve(traces);
                session.close();
            },
            onError: function (error) {
                console.log(error);
                reject(error);
            }
        });
    });

    // console.time('then');
    // return session.run(queryStmt)
    //     .then(result => {
    //         console.timeEnd('then');
    //         return closeConnection(result, session)
    //     });

}


function closeConnection(result, session) {
    session.close();
    return result;
}


//
// const creates = [
//     {type: 'System', values: {name: 'Infrastructre', _id: 'system1', created: 2016, created_by: 'Timo'}},
//     {type: 'Service', values: {name: 'Index', _id: 'service1'}},
//     {type: 'Service', values: {name: 'Service1', _id: 'service2'}},
//     {type: 'Service', values: {name: 'Service2', _id: 'service3'}}
// ];
//
// const stmts = creates.map(elem => `CREATE (:${elem.type} ${JSON.stringify(elem.values).replace(/\"([^(\")"]+)\":/g,"$1:")})`);
//
// console.log(stmts);
// //
// const stmtsPromise = stmts.map(stmt => session.run(stmt));
//
// Promise.all(stmtsPromise)
//     .then(results => {
//         console.log(results);
//     })
//     .then(() => session.close())
//     .catch(err => {
//         console.error(err);
//     });


//
// CREATE (system1:System {name:'Infrastructre', _id: 'system1', created:2016, created_by:'Timo'})
// CREATE (s1:Service {name:'Index', _id:'service1'})
// CREATE (s2:Service {name:'Service1', _id:'service2'})
// CREATE (s3:Service {name:'Service2', _id:'service3'})


//
// MATCH (system1:System {_id: 'system1'})
// MATCH (s1:Service {_id: 'service1'})
// MATCH (s2:Service {_id: 'service2'})
// MATCH (s3:Service {_id: 'service3'})
// CREATE (s1)-[:BELONGS_TO {time:123123}]->(system1)
// CREATE (s2)-[:BELONGS_TO {time:123123}]->(system1)
// CREATE (s3)-[:BELONGS_TO {time:123123}]->(system1)
// ;


// MATCH (s1:Service {_id: 'service1'})
// MATCH (s2:Service {_id: 'service2'})
// CREATE (s1)-[:sent_request {time: 123}]->(s2)
// ;


//
// MATCH (e1: CS)
// MATCH (e2: SR)
// WHERE e1.requestId = e2.requestId
// MATCH (csService: Service {id: e1.appId})
// MATCH (srService: Service {id: e2.appId})
// CREATE (csService)-[:SENT_REQUEST {time: e1.timestamp, duration: e1.duration}]->(srService)
// DELETE e1
// DELETE e2
// ;
//
// MATCH (e3: SS)
// MATCH (e4: CR)
// WHERE e3.requestId = e4.requestId
// MATCH (ssService: Service {id: e3.appId})
// MATCH (crService: Service {id: e4.appId})
// CREATE (ssService)-[:SENT_RESPONSE {time: e3.timestamp, duration: e3.duration}]->(crService)
// DELETE e3
// DELETE e4
// ;

// Count SENT_REQUEST relations between services
// MATCH (sender:Service)-[:SENT_REQUEST]->(receiver:Service)
// WITH sender,count(receiver) as numRelations, receiver
// WHERE numRelations > 1
// RETURN sender, numRelations, receiver
// ;

// MATCH (sender:Service)-[sr:SENT_REQUEST]->(receiver:Service)
// WHERE sr.time > 1463426609682
// WITH sender,count(receiver) as numRelations, receiver
// WHERE numRelations > 0
// RETURN sender, numRelations, receiver
