'use strict';

const fs   = require('fs'),
      path = require('path');

const conf = require('../conf');

const filePath = path.join(conf.dataPath, 'data.json');

if(!fs.existsSync(conf.dataPath)) fs.mkdirSync(conf.dataPath);
if(!fs.existsSync(filePath)){
    const defaultStore = {
        url:   [],
        vcard: []
    }

    fs.writeFileSync(filePath, JSON.stringify(defaultStore), (err) => {
        if(err) console.log(err);
    });
}

function find(type, id){
    return new Promise(async (resolve, reject) => {
        try{
            const data = await _getFileData();

            if(!(type in data)){
                resolve();
            }
            else{
                // Single item
                if(id){
                    resolve(data[type].filter(item => item.id === id)[0]);
                }
                // All items
                else{
                    resolve(data[type]);
                }
            }
        }
        catch(e){ reject(e) }
    });
}

function add(type, opt){

    if(!opt.id) throw new Error('Object must have an id property');

    return new Promise(async (resolve, reject) => {
        try{
            const data = await _getFileData();

            if(!(type in data)) throw new Error('Type not present in data store');

            data[type].push(opt);

            fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf8', (e) => {
                if(e) return reject(e);
                resolve(true);
            });
        }
        catch(e){ reject(e) }
    });
}

function _getFileData(){
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if(err) return reject(err);
            resolve(JSON.parse(data));
        });
    });
}

module.exports = {
    find,
    add
}
