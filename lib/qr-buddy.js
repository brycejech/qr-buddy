
'use strict';

const fs    = require('fs'),
      vCard = require('vcards-js'),
      qr    = require('qrcode');

const randomString = require('./rand-string');

const storagePath = './img',
      svgPath     = `${ storagePath }/svg/`,
      pngPath     = `${ storagePath }/png/`;

if(!fs.existsSync(storagePath)) fs.mkdirSync(storagePath);
if(!fs.existsSync(svgPath))     fs.mkdirSync(svgPath);
if(!fs.existsSync(pngPath))     fs.mkdirSync(pngPath);

async function createImage(data){

    const identifier = await randomString();

    const descriptor = {},
          promises   = [];

    // SVG
    promises.push(new Promise((resolve, reject) => {
        const path = `${ svgPath }${ identifier }.svg`;

        qr.toFile(path, data, { type: 'svg' }, err => {
            if(err) return reject(err);

            descriptor.svg = path;
            resolve();
        });
    }));

    // PNG
    promises.push(new Promise((resolve, reject) => {
        const path = `${ pngPath }${ identifier }.png`;

        qr.toFile(path, data, { type: 'png' }, err => {
            if(err) return reject(err);

            descriptor.png = path;
            resolve();
        });
    }));

    // Data URL
    
    // Should probably not store this in DB
    // Better to use streams to read .png file and send dataURL on request
    // promises.push(new Promise((resolve, reject) => {
    //     qr.toDataURL(data, { type: 'image/png' }, (err, url) => {
    //         if(err) return reject(err);
    //
    //         descriptor.data = url;
    //         resolve();
    //     });
    // }));

    return new Promise((resolve, reject) => {
        Promise.all(promises).then(() => resolve(descriptor)).catch(e => reject(e));
    });
}

async function URL(url){

    if(!(/^https?:\/\//.test(url))){
        throw new Error('URL must begin with http:// or https://');
    }

    return createImage(url);
}

function _vCard(opt){

    const card = vCard();

    card.version = '3.0';

    const allowedProps = [
        // Basic Info
        'firstName', 'lastName', 'uid', 'organization',

        // Phones
        'workPhone', 'homePhone', 'cellPhone', 'pagerPhone',

        // Emails
        'email', 'workEmail',

        // Other Descriptos
        'nickname', 'namePrefix', 'nameSuffix', 'birthday', 'anniversary', 'gender', 'title', 'note',

        // Links
        'url',
        // 'workUrl',

        // Social
        // 'facebook', 'linkedIn', 'twitter', 'flickr', 'custom',

        // Fax Numbers
        'homeFax', 'workFax',

        // Addresses (these must be objects)
        'homeAddress', 'workAddress'
    ];

    for(const [prop, val] of Object.entries(opt)){
        if(allowedProps.indexOf(prop) === -1) continue;


        switch(prop){
            // Set email if looks valid
            case 'email':
            case 'workEmail':
                if(/.*@.*\..{2,}/.test(val)){
                    card[prop] = val;
                }
                break;

            // Handle URLs
            case 'url':
            case 'workUrl':
                // Loose validity check
                if(/^https?:\/\//.test(val)){
                    card[prop] = val;
                }
                break;

            // Social Links
            case 'facebook':
            case 'linkedIn':
            case 'twitter':
            case 'flickr':
            case 'custom':
                if(/^https?:\/\//.test(val)){
                    card.socialUrls[prop] = val;
                }
                break;

            default:
                card[prop] = val;
        }
    }

    return createImage(card.getFormattedString());
}

module.exports = {
    URL: URL,
    vCard: _vCard
}
