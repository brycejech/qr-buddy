'use strict';

const fs      = require('fs'),
      ds      = require('../lib/data-store'),
      qrBuddy = require('../lib/qr-buddy');

const router = require('express').Router();

module.exports = function urlRoutes(express){

    // Get list of all URL QR codes
    // Should disable this in prod
    router.get('/api/v1/url', async (req, res, next) => {
        try{
            let results = await ds.find('url');

            results = results.map(getPublicDescriptor);

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
    router.get('/api/v1/url/:id', async (req, res, next) => {
        const item = await ds.find('url', req.params.id);

        if(!item) return res.status(404).json({ message: 'Not found' });

        res.json(getPublicDescriptor(item));
    });

    // Get an SVG of a URL QR code
    router.get('/url/:id/svg', async (req, res, next) => {
        const item = await ds.find('url', req.params.id);

        if(!item) return res.status(404).json({ message: 'Not found' });

        fs.access(item.svgFilepath, fs.constants.F_OK, err => {
            if(err) return res.status(404).json({ message: 'Not found' });

            const stream = fs.createReadStream(item.svgFilepath);

            stream
                .on('close', () => res.end())
                .on('error', e => {
                    stream.close();
                    res.status(500).json({ message: 'Server error' });
                });

            res.type('svg');

            stream.pipe(res);
        });
    });

    // Get a PNG of a URL QR code
    router.get('/url/:id/png', async (req, res, next) => {
        const item = await ds.find('url', req.params.id);

        if(!item) return res.status(404).json({ message: 'Not found' });

        fs.access(item.pngFilepath, fs.constants.F_OK, err => {
            if(err) return res.status(404).json({ message: 'Not found' });

            const stream = fs.createReadStream(item.pngFilepath);

            stream
                .on('close', () => res.end())
                .on('error', e => {
                    stream.close();
                    res.status(500).json({ message: 'Server error' });
                });

            res.type('png');

            stream.pipe(res);
        });
    });

    // Sanitize internal QR descriptor object for public viewing
    function getPublicDescriptor(o){

        const publicProps = ['id', 'apiUrl', 'svgUrl', 'pngUrl', 'created'];

        const data = {};

        for(const prop of publicProps){
            data[prop] = o[prop];
        }

        return data;
    }

    return router;
}
