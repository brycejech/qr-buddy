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


    // Create a QR code that sends an email
    router.put('/api/v1/email', async (req, res, next) => {
        if(!req.body.email){
            return res.status(400).send({ message: 'Must provide an email address' });
        }

        try{
            const result = await qrBuddy.email(req.body.email, req.body.subject, req.body.body);

            return res.json(getPublicDescriptor(result));
        }
        catch(e){
            console.log(e);
            return res.status(500).json({ err: e });
        }
    });


    // Create a QR code that sends an SMS text
    router.put('/api/v1/sms', async (req, res, next) => {
        if(!req.body.number){
            return res.status(400).json({ message: 'Must provide a phone number' });
        }

        try{
            const result = await qrBuddy.sms(req.body.number, req.body.body);

            return res.json(getPublicDescriptor(result));
        }
        catch(e){
            console.log(e);
            return res.status(500).json({ err: e });
        }
    });


    // Create a QR code that calls a phone number
    router.put('/api/v1/phone', async (req, res, next) => {
        try{
            const result = await qrBuddy.phone(req.body.number);

            return res.json(getPublicDescriptor(result));
        }
        catch(e){
            console.log(e);
            return res.status(500).json({ err: e });
        }
    });


    // Create a QR code with coordinates
    router.put('/api/v1/geo', async (req, res, next) => {
        if(!(req.body.lat && req.body.lon)){
            return res.status(400).json({ message: 'Missing required parameters lat and/or lon' });
        }

        try{
            const result = await qrBuddy.geo(req.body.lat, req.body.lon);

            return res.json(getPublicDescriptor(result));
        }
        catch(e){
            console.log(e);
            return res.status(500).send({ err: e });
        }
    });

    // Create a QR code with network credentials
    router.put('/api/v1/wifi', async (req, res, next) => {
        if(!(req.body.type  && req.body.ssid && req.body.password)){
            return res.status(400).json({ message: 'Must provide network type, SSID, and password' });
        }

        try{
            const result = await qrBuddy.wifi(req.body.type, req.body.ssid, req.body.password);

            return res.json(getPublicDescriptor(result));
        }
        catch(e){
            console.log(e);
            return res.status(500).json({ err: e });
        }
    });

    // Create a QR code with plaintext
    router.put('/api/v1/text', async (req, res, next) => {
        if(!req.body.text) return res.status(400).json({ message: 'Must provide text to encode' });

        try{
            const result = await qrBuddy.text(req.body.text);

            return res.json(getPublicDescriptor(result));
        }
        catch(e){
            console.log(e);
            return res.status(500).json({ err: e });
        }
    });

    return router;
}
