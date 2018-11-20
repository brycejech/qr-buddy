
'use strict';

const fs    = require('fs'),
      vCard = require('vcards-js'),
      qr    = require('qrcode');

const randomString = require('./rand-string'),
      ds           = require('./data-store');

const conf = require('../conf');

if(!fs.existsSync(conf.imgPath)) fs.mkdirSync(conf.imgPath);
if(!fs.existsSync(conf.svgPath)) fs.mkdirSync(conf.svgPath);
if(!fs.existsSync(conf.pngPath)) fs.mkdirSync(conf.pngPath);

async function createImage(type, data){

    const identifier = await randomString();

    const descriptor = {
        id:       identifier,
        created:  (new Date()).toUTCString(),
        apiUrl:   `${ conf.httpHost }api/v1/${ type }/${ identifier }`,
        data:     data,
        dataType: type
    }

    const promises = [];

    // SVG
    promises.push(new Promise((resolve, reject) => {
        const path = `${ conf.svgPath }${ identifier }.svg`;

        qr.toFile(path, data, { type: 'svg', margin: 1 }, err => {
            if(err) return reject(err);

            descriptor.svgFilepath = path;
            descriptor.svgUrl  = `${ conf.httpHost }${ type }/${ identifier }/svg`;
            descriptor.svgRaw  = `${ conf.httpHost }${ type }/${ identifier }/svgRaw`;

            resolve();
        });
    }));

    // PNG
    promises.push(new Promise((resolve, reject) => {
        const path = `${ conf.pngPath }${ identifier }.png`;

        qr.toFile(path, data, { type: 'png', margin: 1 }, err => {
            if(err) return reject(err);

            descriptor.pngFilepath = path;
            descriptor.pngUrl  = `${ conf.httpHost }${ type }/${ identifier }/png`;
            descriptor.pngRaw  = `${ conf.httpHost }${ type }/${ identifier }/pngRaw`;

            resolve();
        });
    }));

    return new Promise((resolve, reject) => {
        Promise.all(promises)
            .then(() => {
                // add object to data storage
                ds.add(type, descriptor)
                    .then(() => {
                        resolve(descriptor);
                    })
                    .catch(e => reject(e));
            })
            .catch(e => reject(e));
    });
}

function url(url){

    if(!(/^https?:\/\//.test(url))){
        throw new Error('URL must begin with http:// or https://');
    }

    return createImage('url', url);
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
        // 'workUrl', (not compatible w/iPhone)

        // Social (not compatible w/iPhone)
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

    return createImage('vcard', card.getFormattedString());
}


function email(address, subject, body){
    /*
        Format (must be URI encoded):
        mailto:<address>?subject=<Email Subject>&body=<Body Text>
        mailto:me@website.com?subject=Hello%20There&body=Hello%20Again
    */
    if(!(/.*@.*\..{2,}/.test(address))){
        throw new Error('Address must look like an email');
    }

    const querystring = [];

    if(subject) querystring.push(`subject=${ encodeURIComponent(subject) }`);
    if(body)    querystring.push(`body=${ encodeURIComponent(body) }`);

    let string = `mailto:${ address }`;

    if(querystring.length) string += `?${ querystring.join('&') }`;

    return createImage('email', string);
}

function sms(number, body){
    /*
        Format:
        sms:+<Country Code><Phone Number>
        sms:+15554235575
    */
    number = number.replace(/\s|\(|\)|-/g, '');

    if(number.length != 10) throw new Error('Phone number must contain ten numbers');

    number = `sms:${ encodeURIComponent('+') }1${ number }`;

    if(body) number += `;?&body=${ encodeURIComponent(body) }`;

    return createImage('sms', number);
}

function phone(number){
    /*
        Format:
        tel:+<Country Code><Phone Number>
        tel:+15554235575
    */
    number = number.replace(/\s|\(|\)|-/g, '');

    if(number.length != 10) throw new Error('Phone number must container ten numbers');

    number = `tel:+1${ number }`;

    return createImage('phone', number);
}
/* Examples */

/*
qrBuddy.URL('https://brycejech.com')
    .then(result => {
        console.log(result);
    })
    .catch(e => console.log(e));

// This example shows all fields that are compatible with iPhone contacts
const vCard = qrBuddy.vCard({
    firstName:  'Linus',
    lastName:   'Torvalds',
    nickname:   'Linux Master',
    organization: 'LKML',
    cellPhone:  '(405)555-1234',
    workPhone:  '(888)555-4321',
    homePhone:  '(789)555-9876',
    pagerPhone: '(405)555-9876',
    homeFax: '(999)555-1234',
    workFax: '(888)555-1234',
    email:      'ltorvalds@lkml.org',
    workEmail:   'ltorvalds@linuxkernal.org',
    namePrefix: 'Mr',
    nameSuffix: 'III',
    gender: 'M',
    birthday: new Date('03-25-1963'),
    anniversary: new Date('01-01-1997'),
    title: 'Linux Kernel Maintainer',
    note: 'Linux Wizard',
    url: 'https://ltorvalds.com'
})
.then(data => console.log(data))
.catch(e => console.log(e));
*/

module.exports = {
    url:   url,
    vCard: _vCard,
    email: email,
    sms:   sms,
    phone: phone
}
