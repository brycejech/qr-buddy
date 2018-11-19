'use strict';

const router = require('express').Router();

module.exports = function(express){
    const create   = require('./create')(express),
          generics = require('./generics')(express);

    router.use(create);
    router.use(generics);

    return router;
}
