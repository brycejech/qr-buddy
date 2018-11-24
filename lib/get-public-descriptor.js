'use strict';

// Sanitize internal QR descriptor object for public viewing
function getPublicDescriptor(o){

    const publicProps = [
        'id', 'apiUrl', 'svgUrl', 'svgRaw', 'pngUrl', 'pngRaw',
        'created', 'data', 'dataType', 'dataAttachment'
    ];

    const data = {};

    for(const prop of publicProps){
        data[prop] = o[prop];
    }

    return data;
}

module.exports = getPublicDescriptor;
