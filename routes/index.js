'use strict';

const router = require('express').Router();

module.exports = function(express){
    const urlRouter   = require('./url')(express),
          vCardRouter = require('./vCard')(express);

    router.use(urlRouter);
    router.use(vCardRouter);

    return router;
}
