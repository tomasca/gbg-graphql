/*
 * Copyright (c) 2017 Tomas Carlfalk
 *
 * This is the entrypoint when deployed on a server.
 */
'use strict';
var express = require('express');
var graphqlHTTP = require('express-graphql');
var graphql = require('graphql');
var gbgapi = require('./gbgapi')

var app = express();
app.use('/graphql', graphqlHTTP({
  schema: gbgapi.schema,
  rootValue: gbgapi.root,
  graphiql: true,
}));
app.listen(1337);
console.log('Running a GraphQL API server at localhost:1337/graphql');