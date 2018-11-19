'use strict';

const fs        = require('fs'),
      fsHelpers = require('../lib/fs-helpers'),
      ds        = require('../lib/data-store'),
      qrBuddy   = require('../lib/qr-buddy');

const getPublicDescriptor = require('../lib/get-public-descriptor');

const router = require('express').Router();

module.exports = function urlRoutes(express){

    // Get list of all URL QR codes
    // Should disable this in prod
    router.get('/api/v1/url', async (req, res, next) => {
        try{
            let results = await ds.find('url');

            results = results.map(getPublicDescriptor).reverse(); // Most recent first

            res.json(results);
        }
        catch(e){ res.status(500).send({ err: e }) }
    });

    // Create QR code with URL
    router.put('/api/v1/url', async (req, res, next) => {
        try{
            const result = await qrBuddy.url(req.body.url);

            return res.json(getPublicDescriptor(result));
        }
        catch(e){
            console.log(e);
            return res.status(500).json({ err: e });
        }
    });

    // Get QR code descriptor
    router.get('/api/v1/url/:id', _findItem, async (req, res, next) => {
        const item = getPublicDescriptor(res.locals.item)

        res.json(item);
    });

    // Get an SVG of a URL QR code
    router.get('/url/:id/svg', _findItem, async (req, res, next) => {
        const item = res.locals.item;

        if(!(await fsHelpers.fileExists(item.svgFilepath))){
            return res.status(404).json({ message: 'Image file not found' });
        }

        const stream = fs.createReadStream(item.svgFilepath);

        stream
            .on('close', () => res.end())
            .on('error', e => {
                stream.close(); // Close file descriptor
                res.status(500).json({ message: 'Server error' });
            });

        res.type('svg');

        stream.pipe(res);
    });

    // Get a dataURL of a URL QR code
    router.get('/url/:id/svgRaw', _findItem, async (req, res, next) => {
        const item = res.locals.item;

        if(!(await fsHelpers.fileExists(item.svgFilepath))){
            return res.status(404).json({ message: 'Image file not found' });
        }

        try{
            const dataUrl = await fsHelpers.getFileDataUrl(item.svgFilepath);

            res.type('text');

            return res.send(dataUrl);
        }
        catch(e){
            return res.status(500).send({ message: 'Server error' });
        }
    });

    // Get a PNG of a URL QR code
    router.get('/url/:id/png', _findItem, async (req, res, next) => {
        const item = res.locals.item;

        if(!(await fsHelpers.fileExists(item.pngFilepath))){
            return res.status(404).json({ message: 'Image file not found' });
        }

        const stream = fs.createReadStream(item.pngFilepath);

        stream
            .on('close', () => res.end())
            .on('error', e => {
                stream.close(); // Close file descriptor
                res.status(500).json({ message: 'Server error' });
            });

        res.type('png');

        stream.pipe(res);
    });

    router.get('/url/:id/pngRaw', _findItem, async (req, res, next) => {
        const item = res.locals.item;

        if(!(await fsHelpers.fileExists(item.pngFilepath))){
            return res.status(404).json({ message: 'Image file not found' });
        }

        try{
            const fileData = await fsHelpers.getFileDataUrl(item.pngFilepath);

            res.type('text');

            return res.send(fileData);
        }
        catch(e){
            console.log(e);
            return res.status(500).json({ message: 'Server error' });
        }
    });

    return router;
}


async function _findItem(req, res, next){
    if(!req.params.id) return next();

    const item = await ds.find('url', req.params.id);

    // If item wasn't found, kill the request
    if(!item) return res.status(404).json({ message: 'Not found' });

    res.locals.item = item;

    return next();
}
