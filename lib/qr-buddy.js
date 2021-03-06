
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

async function createImage(type, data, dataAttachment){

    const identifier = await randomString();

    const descriptor = {
        id: identifier,
        created: (new Date()).toUTCString(),
        apiUrl: `${ conf.httpHost }api/v1/${ type }/${ identifier }`,
        data: data,
        dataAttachment: dataAttachment || data,
        dataType: type
    }

    const promises = [];

    // SVG
    promises.push(new Promise((resolve, reject) => {
        const path = `${ conf.svgPath }${ identifier }.svg`;

        qr.toFile(path, data, { type: 'svg', margin: 0 }, err => {
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

        qr.toFile(path, data, { type: 'png', margin: 0 }, err => {
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

    return createImage('url', url, { url });
}


function _vCard(opt){

    // TODO: Add support for addresses

    const data = {};

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
                    data[prop] = val;
                }
                break;

            // Handle URLs
            case 'url':
            case 'workUrl':
                // Loose validity check
                if(/^https?:\/\//.test(val)){
                    data[prop] = val;
                }
                break;

            // Social Links
            case 'facebook':
            case 'linkedIn':
            case 'twitter':
            case 'flickr':
            case 'custom':
                if(/^https?:\/\//.test(val)){
                    data.socialUrls[prop] = val;
                }
                break;

            default:
                data[prop] = val;
        }
    }

    const card = vCard();

    card.version = '3.0';

    for(const prop in data){
        card[prop] = data[prop];
    }

    return createImage('vcard', card.getFormattedString(), data);
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

    const attachment = {};
    address && (attachment.address = address);
    subject && (attachment.subject = subject);
    body    && (attachment.body    = body);

    return createImage('email', string, attachment);
}


function sms(number, body){

    // TODO: Add support for other country codes

    /*
        Format:
        sms:+<Country Code><Phone Number>
        sms:+15554235575
    */
    number = number.replace(/\D/g, '');
    let str = number;

    if(str.length != 10) throw new Error('Phone number must contain ten numbers');

    str = `sms:${ encodeURIComponent('+') }1${ str }`;

    if(body) str += `;?&body=${ encodeURIComponent(body) }`;

    const attachment = {};
    number && (attachment.number = number);
    body   && (attachment.body   = body);

    return createImage('sms', str, attachment);
}


function phone(number){

    // TODO: Add support for other country codes

    /*
        Format:
        tel:+<Country Code><Phone Number>
        tel:+15554235575
    */
    number = number.replace(/\D/g, '');
    let str = number;

    if(!(/^\d+$/.test(str))) throw new Error('Phone number must be numeric');
    if(str.length != 10)     throw new Error('Phone number must container ten numbers');

    str = `tel:+1${ str }`;

    return createImage('phone', str, { number });
}

function geo(lat, lon){
    /*
        Format:
        geo:<lat>,<lon>,<altitude>
        geo:39.289140,-83.049996,0
    */

    const rgx = /^(\+|-)?\d{1,3}\.\d+$/;

    if(!(rgx.test(lat) && rgx.test(lon))){
        throw new Error('Coordinates not valid');
    }

    return createImage('geo', `geo:${ lat },${ lon },0`, { lat, lon });
}

function wifi(type, ssid, password, hidden){
    /*
        Format:
        WIFI:T:<Network Type>;S:<Network SSID>;P:<Network Password>;H:<Hidden>; (Hidden is optional)
        WIFI:T:WPA;S:my-network;P:mySecurePassword;;
        WIFI:T:WEP;S:myOtherNetwork;P:otherPasswordz;H:true;
    */

    if(!(ssid && password && type)) throw new Error('Must provide SSID, password, and network type');

    type = type.toUpperCase();

    if(type !== 'WPA' && type !== 'WEP') throw new Error('Type must be WPA or WEP');

    // For backslash escape to work the input backslash must itself be escaped
    const replaceExp = /(,|"|;|:|\\)/g;
    // Escape special characters
    ssid = ssid.replace(replaceExp, '\\$1');
    password = password.replace(replaceExp, '\\$1');

    const attachment = {};
    type && (attachment.type = type);
    ssid && (attachment.ssid = ssid);
    password && (attachment.password = password);
    attachment.hidden = !!hidden;

    return createImage('wifi', `WIFI:T:${ type };S:${ ssid };P:${ password };H:${ !!hidden };`, attachment);
}

function text(str){
    if(!str) throw new Error('Must provide text to encode');

    return createImage('text', str, { string: str });
}


module.exports = {
    url:   url,
    vCard: _vCard,
    email: email,
    sms:   sms,
    phone: phone,
    geo:   geo,
    wifi:  wifi,
    text:  text
}
