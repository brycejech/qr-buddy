'use strict';

const router = require('express').Router();

module.exports = function(server){
    const create   = require('./create')(server),   // PUT routes
          generics = require('./generics')(server); // GET routes

    server.use(create);
    server.use(generics);
}
