'use strict';

/*
    Generic routes for getting descriptors and images of all supported types
*/

const fs        = require('fs'),
      fsHelpers = require('../lib/fs-helpers'),
      ds        = require('../lib/data-store');

const getPublicDescriptor = require('../lib/get-public-descriptor');

const router = require('express').Router();

module.exports = function genericRoutes(express){

    const supportedTypes = [
        'url',
        'vcard',
        'email',
        'sms',
        'phone',
        'geo',
        'wifi',
        'text'
    ];

    // Check that req.params.type is supported, 400 if not
    function _ckType(req, res, next){
        const type = res.locals.type = req.params.type;

        if(supportedTypes.indexOf(type) === -1){
            return res.status(400).json({ message: `${ type } type not supported` });
        }
        next();
    }

    // Get list of all QR codes of :type
    // Good idea to disable this in production
    router.get('/api/v1/:type', _ckType, async (req, res, next) => {
        const type = res.locals.type;

        try{
            let results = await ds.find(type);

            // Most recent results first
            results = results.map(getPublicDescriptor).reverse();

            res.json(results);
        }
        catch(e){ res.status(500).json({ message: 'Server error' }) }
    });

    // Get QR code descriptor object
    router.get('/api/v1/:type/:id', _ckType, _findItem, async (req, res, next) => {
        const item = getPublicDescriptor(res.locals.item)

        res.json(item);
    });

    // Get an SVG image
    router.get('/:type/:id/svg', _ckType, _findItem, async (req, res, next) => {
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

    // Get a dataUrl for SVG image e.g. data:image/svg+xml;base64,<the file data>
    // Useful for canvas elements, img[src] attributes, window.open, etc
    router.get('/:type/:id/svgRaw', _ckType, _findItem, async (req, res, next) => {
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

    // Get a PNG
    router.get('/:type/:id/png', _ckType, _findItem, async (req, res, next) => {
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


    // Get a dataUrl for PNG image e.g. data:image/svg+xml;base64,<the file data>
    // Useful for canvas elements, img[src] attributes, window.open, etc
    router.get('/:type/:id/pngRaw', _ckType, _findItem, async (req, res, next) => {
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

// Finds items in data store based on type and identifier
// Kills the request if not found or missing ID
async function _findItem(req, res, next){
    if(!req.params.id){
        return res.status(400).json({ message: 'Missing :id parameter' });
    }

    const item = await ds.find(res.locals.type, req.params.id);

    // If item wasn't found, kill the request
    if(!item) return res.status(404).json({ message: 'Not found' });

    res.locals.item = item;

    return next();
}
