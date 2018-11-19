'use strict';

const fs        = require('fs'),
      fsHelpers = require('../lib/fs-helpers'),
      ds        = require('../lib/data-store'),
      qrBuddy   = require('../lib/qr-buddy');

const getPublicDescriptor = require('../lib/get-public-descriptor');

const router = require('express').Router();

module.exports = function urlRoutes(express){

    // Create a QR code containing a URL
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

    // Create a QR code containing a vCard
    router.put('/api/v1/vcard', async (req, res, next) => {
        try{
            const data = {};

            const allowedProps = [
                // Name
                'namePrefix', 'firstName', 'lastName', 'nameSuffix', 'nickname',
                // Org
                'organization', 'title', 'website',
                // Emails
                'email', 'workEmail',
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
                if(req.body[prop] && req.body[prop].trim()){
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

    return router;
}
