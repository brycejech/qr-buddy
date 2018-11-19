'use strict';

const fs = require('fs');

function fileExists(path){
    return new Promise((resolve, reject) => {
        fs.access(path, fs.constants.F_OK, err => {
            if(err) return resolve(false);
            resolve(true);
        });
    });
}

function getFileDataUrl(fileName){
    return new Promise((resolve, reject) => {

        const fileParts = fileName.split('.');

        if(fileParts.length < 2) return reject('getFileDataUrl: No file extension provided');

        const validExtensions = ['png', 'svg'];

        const ext = fileParts[fileParts.length - 1];

        if(validExtensions.indexOf(ext) === -1){
            return reject(`getFileDataUrl: File extension must be in "${ validExtensions.join(',') }"`);
        }

        fs.readFile(fileName, 'base64', (err, data) => {
            if(err) return reject(err);

            switch(ext){
                case 'png':
                    data = 'data:image/png;base64,' + data;
                    break;
                case 'svg':
                    data = 'data:image/svg+xml;base64,' + data;
                    break;
                default:
                    reject(`getFileDataUrl: Unknown issue with ${ ext }`);
            }

            resolve(data);
        });
    });
}

module.exports = {
    fileExists,
    getFileDataUrl
}
