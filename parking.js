/*
 * Copyright (c) 2017 Tomas Carlfalk
 *
 */
'use strict';
var express = require('express');
var graphqlHTTP = require('express-graphql');
var graphql = require('graphql');
var http = require('http');
var JSONStream = require('JSONStream')


module.exports.gbggraphql = (event, context, callback) => {
  /*
    const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully! Foobar!',
      input: event,
    }),
  };

  callback(null, response);
*/
 var query = event.body
 graphql.graphql(schema, query, root).then((graphQLresponse) => {
    //console.log(graphQLresponse);
    const response = {
      statusCode: 200,
      body: JSON.stringify(graphQLresponse),
    };

    callback(null, response);
  });
};


// The schema definition, using GraphQL schema language
var schema = graphql.buildSchema(`
  
  input GeoLocationCriteria {
    latitude: Float!
    longitude: Float!
    radius: Int!
  }

  type GeoLocation {
    latitude: Float!
    longitude: Float!
  }

  type Parking {
    id: String
    name: String
    owner: String
    totalSpaces: Int
    distance: Int
    location: GeoLocation
    maxParkingTime: Int
    wkt: String
  }

  type Query {
    info: String
    parkings(location: GeoLocationCriteria): [Parking] 
  }

  
`);

function parseParkingTime(str) {
    if (str) {
      var vals = str.split(" ");
      var num = vals[0]
      var unit = vals[1]
      if (unit == "tim") {
        return num * 60
      } 
      if (unit == "min") {
        return num
      }
      console.log("Unknown time unit: " + unit)
    }
    return null
}

class GeoLocation {
  constructor(latitude, longitude) {
    this.latitude = latitude
    this.longitude = longitude
  }
}

class Parking {
  constructor(data) {
    this.id = data.Id
    this.name = data.Name
    this.wkt = data.WKT
    this.owner = data.Owner
    this.totalSpaces = data.ParkingSpaces
    this.distance = data.Distance
    if (data.Lat && data.Long) {
      this.location = new GeoLocation(data.Lat, data.Long)
    }
    this.maxParkingTime = parseParkingTime(data.MaxParkingTime)
  }
}

function readParkings(location) {
  return new Promise(function(fulfill, reject) {
    var options = {
      host: 'data.goteborg.se',
      port: 80,
      path: `/ParkingService/v2.1/PublicTimeParkings/${process.env.GBG_APPID}?format=json`,
      method: 'GET'
    }
    if (location) {
      options.path += `&latitude=${location.latitude}&longitude=${location.longitude}`
      if (location.radius) {
        options.path += `&radius=${location.radius}`
      }
    }
    console.log("Fetching parkings... from ", options.host, options.path)
    var req = http.request(options, response => {
      console.log("Data fetched, response status: ", response.statusCode);
  
      var result = []
      var parser = JSONStream.parse('*');
      parser.on('data', data => {
        result.push(new Parking(data))
      });
      parser.on('end', () => {
        console.log("No more data. Records recieved ", result.length)
        fulfill(result)
      })

      response.pipe(parser);

    });

    req.end();
  });
}

// The root provides a resolver function for each API endpoint
var root = {
  info: () => 'This is the GraphQL enabled Parking API',
  parkings: location => readParkings(location.location),
};

/*
var app = express();
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));
app.listen(1337);
console.log('Running a GraphQL API server at localhost:1337/graphql');
*/