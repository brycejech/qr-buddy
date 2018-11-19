'use strict';

const fs = require('fs');

const router = require('express').Router();

const qrBuddy = require('../lib/qr-buddy'),
      ds      = require('../lib/data-store');

const getPublicDescriptor = require('../lib/get-public-descriptor');

module.exports = function vCardRoutes(express){

    // Get all vCards
    router.get('/api/v1/vcard', async (req, res, next) => {
        let vcards = await ds.find('vcard');

        vcards = vcards.map(getPublicDescriptor).reverse();

        res.json(vcards);
    });

    // Create QR code with URL
    router.put('/api/v1/vcard', async (req, res, next) => {
        try{
            const data = {};

            const allowedProps = [
                // Name
                'namePrefix', 'firstName', 'lastName', 'nameSuffix', 'nickname',
                // Org
                'organization', 'title', 'website',
                // Emails
                'homeEmail', 'workEmail',
                // Phones
                'cellPhone', 'workPhone', 'homePhone', 'pager',
                // Faxes
                'homeFax', 'workFax',
                // Dates
                'birthday', 'anniversary',
                // Notes
                'notes'
            ];

            for(const prop of allowedProps){
                if(req.body[prop].trim()){
                    data[prop] = req.body[prop];
                }
            }

            if(data.birthday){
                data.birthday = new Date(data.birthday);
            }

            if(data.anniversary){
                data.anniversary = new Date(data.anniversary);
            }

            const vCard = qrBuddy.vCard(data)
                .then(result => {
                    return res.json(result);
                })
                .catch(e => {
                    console.log(e);
                    return res.status(500).json({ err: e });
                });
        }
        catch(e){
            console.log(e);
            return res.status(500).json({ err: e });
        }
    });

    // Get QR code descriptor
    router.get('/api/v1/vcard/:id', async (req, res, next) => {
        const item = await ds.find('vcard', req.params.id);

        if(!item) return res.status(404).json({ message: 'Not found' });

        res.json(getPublicDescriptor(item));
    });

    router.get('/vcard/:id/svg', async (req, res, next) => {
        const item = await ds.find('vcard', req.params.id);

        if(!item) return res.status(404).json({ message: 'Not found' });

        fs.access(item.svgFilepath, fs.constants.F_OK, err => {
            if(err) return res.status(404).json({ message: 'Not found' });

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
    });

    router.get('/vcard/:id/svgRaw', async (req, res, next) => {
        const item = await ds.find('vcard', req.params.id);

        if(!item) return res.status(404).json({ message: 'Not found' });

        fs.readFile(item.svgFilepath, 'base64', (err, data) => {
            if(err) return res.status(500).json({ message: 'Server error' });

            data = 'data:image/svg+xml;base64,' + encodeURIComponent(data);

            res.type('text');

            res.send(data);
        });
    });

    router.get('/vcard/:id/png', async (req, res, next) => {
        const item = await ds.find('vcard', req.params.id);

        if(!item) return res.status(404).json({ message: 'Not found' });

        fs.access(item.pngFilepath, fs.constants.F_OK, err => {
            if(err) return res.status(404).json({ message: 'Not found' });

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
    });

    router.get('/vcard/:id/pngRaw', async (req, res, next) => {
        const item = await ds.find('vcard', req.params.id);

        if(!item) return res.status(404).json({ message: 'Not found' });

        fs.readFile(item.pngFilepath, 'base64', (err, data) => {
            if(err) return res.status(500).json({ message: 'Server error' });

            data = 'data:image/png;base64,' + data;

            res.type('text');

            res.send(data);
        });
    });

    return router;
}
