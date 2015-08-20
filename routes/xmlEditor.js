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
    fs.readFile(pathP.join(_dir, "uploads", zipname, filename), 'utf-8', function (err, data) {
        if(!err)
        callback(false, data);
    });
};

var writeXmlFile = function (folder, file, data, callback) {
    fs.writeFile(pathP.join(_dir, "uploads", folder, file), data, 'utf-8', function (err) {
        if(!err)
            callback(false);
        else
            callback(err);
    });
};

var getCaretPos = function (dataString, tagName, tagNum, childNum, callback) {
    var caretPos = getPosition(dataString, "<"+tagName+">", tagNum);
    var caretEnd = getPosition(dataString, "</"+tagName+">", tagNum)
    callback(caretPos, caretEnd + tagName.length + 3);
}

var getPosition = function(str, m, i) {
    return str.split(m, i).join(m).length;
};


module.exports = {
    readXmlFile: readXmlFile,
    writeXmlFile: writeXmlFile,
    createDomFromXml: createDomFromXml,
    getCaretPos: getCaretPos
}