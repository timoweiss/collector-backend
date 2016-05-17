'use strict';

const neo = require('neo4j-driver').v1;

const neoConnection = neo.driver("bolt://localhost", neo.auth.basic("neo4j", "mypassword"));

module.exports = {
    addNode,
    addServiceSystemRelation,
    getGraphBySystemId
};


setInterval(findConnectedEventsAndCleanUp, 10000);

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

    console.log('running:', relationStmt);
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
                        CREATE (csService)-[:SENT_REQUEST {time: e1.timestamp, duration: e1.duration, name: e1.name}]->(srService)
                        DELETE e1
                        DELETE e2
                        ;
                        `;
    let sscrStmt = `MATCH (e3: SS)
                        MATCH (e4: CR)
                        WHERE e3.requestId = e4.requestId
                        MATCH (ssService: Service {id: e3.appId})
                        MATCH (crService: Service {id: e4.appId})
                        CREATE (ssService)-[:SENT_RESPONSE {time: e3.timestamp, duration: e3.duration, name: e3.name}]->(crService)
                        DELETE e3
                        DELETE e4
                        ;
                        `;

    console.log('running:', cssrStmt, sscrStmt);
    Promise.all([session.run(cssrStmt), session.run(sscrStmt)])
        .then(result => {
            console.log('findConnectedEventsAndCleanUp success:', result);
            closeConnection(result, session)
        })
        .catch(err => console.error('findConnectedEventsAndCleanUp error:', err));
}


function getGraphBySystemId(systemId, timeFrom) {
    let session = neoConnection.session();
    let relationStmt = `MATCH (sender:Service)-[sr:SENT_REQUEST]->(receiver:Service)
                        MATCH (system:System)<- [:BELONGS_TO]-(sender)
                        WHERE system.id = "${systemId}"
                        WITH sender,sr,receiver
                        WHERE sr.time > ${timeFrom}
                        WITH sender,count(receiver) as numRelations, receiver
                        WHERE numRelations > 0
                        RETURN sender, numRelations, receiver
                        `;

    console.log('running:', relationStmt);
    return session.run(relationStmt)
        .then(result => {
            return closeConnection(result, session)
        });
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
