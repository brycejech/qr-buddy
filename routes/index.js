'use strict';

const router = require('express').Router();

module.exports = function(express){
    const create   = require('./create')(express),   // PUT routes
          generics = require('./generics')(express); // GET routes

    router.use(create);
    router.use(generics);

    return router;
}
