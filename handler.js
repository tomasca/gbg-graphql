/*
 * Copyright (c) 2017 Tomas Carlfalk
 *
 * This is the entrypoint when deployed serverless.
 */
'use strict';
var graphql = require('graphql');
var gbgapi = require('./gbgapi')

module.exports.gbggraphql = (event, context, callback) => {
	var query = event.body
	graphql.graphql(gbgapi.schema, query, gbgapi.root).then((graphQLresponse) => {
		const response = {
			statusCode: 200,
			body: JSON.stringify(graphQLresponse),
		};

		callback(null, response);
	});
};