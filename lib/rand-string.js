'use strict';

const crypto = require('crypto');

module.exports = function randomString(n=24){
    return new Promise((resolve, reject) => {
        crypto.randomBytes(n, (err, buf) => err ? reject(err) : resolve(buf.toString('hex')) );
    });
}
