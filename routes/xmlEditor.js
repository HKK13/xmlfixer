/**
 * Created by Kaan on 17/08/15.
 */
var xmlParser = require('../routes/XmlParser'),
    mkdrip = require('mkdirp'),
    fs = require('fs'),
    xmldom = require('xmldom').DOMParser,
    xmlSer = require('xmldom').XMLSerializer,
    pathP = require('path');

var _dir = pathP.join(__dirname, "/..", "public");

var readXmlFile = function (zipname, filename, callback) {
    fs.readFile(pathP.join(_dir, "uploads", zipname, filename), function (err, data) {
        if(!err)
        callback(false, data);
    });
};

var writeXmlFile = function (folder, file, data, callback) {
    fs.writeFile(pathP.join(_dir, "uploads", folder, file), data, function (err) {
        if(!err)
            callback(false);
        else
            callback(err);
    });
};

var createDomFromXml = function (data, callback) {
    var doc = new xmldom({  //Configure xmldom.
        errorHandler: {
            warning: function (err) {
                console.log(err);
            },
            error: function (err) {
                if (warningFileList.indexOf(filename) < 0) {
                    console.log("Warning! File or Syntax might be corrupt:" + filename);
                }
            },
            fatalError: function (err) {
                console.log(err + "\t Filename" + filename);
            }
        }
    }).parseFromString(data, "text/xml");
    callback(false, doc);
};



module.exports = {
    readXmlFile: readXmlFile,
    writeXmlFile: writeXmlFile,
    createDomFromXml: createDomFromXml
}