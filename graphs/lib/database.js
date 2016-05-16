'use strict';

const neo = require('neo4j-driver').v1;

const neoConnection = neo.driver("bolt://localhost", neo.auth.basic("neo4j", "mypassword"));

module.exports = {
    addNode
};

function addNode(nodeData) {
    let session = neoConnection.session();
    let createStmt = `CREATE (:${nodeData.type} ${JSON.stringify(nodeData.values).replace(/\\"/g,"").replace(/\"([^(\")"]+)\":/g,"$1:")})`;

    return session.run(createStmt)
        .then(result => closeConnection(result, session));
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



