/**
 * Created by Kaan on 17/08/15.
 */
var fs = require('fs'),
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

var getCaretPos = function (dataString, tagName, tagNum, childNum, callback) { //Gets caret position of string in order to provide highlighting.
    var caretPos = getPosition(dataString, "<"+tagName+">", tagNum);
    var caretEnd = getPosition(dataString, "</"+tagName+">", tagNum);
    callback(caretPos, caretEnd + tagName.length + 3);
}

var getPosition = function(str, strSearching, tagNum) {
    return str.split(strSearching, tagNum).join(strSearching).length;
};


module.exports = {
    readXmlFile: readXmlFile,
    writeXmlFile: writeXmlFile,
    getCaretPos: getCaretPos
}