/**
 * Created by Kaan on 28/07/15.
 */
var AdmZip = require('adm-zip'),
    mkdrip = require('mkdirp'),
    fs = require('fs'),
    xmldom = require('xmldom').DOMParser,
    xmlSer = require('xmldom').XMLSerializer,
    pathP = require('path');

//TODO Kaan bu class? comment eder misin, file'in nerelerde processlerden ge�ildi?inin bilinmesi iyi, her metoda birer tane tan?mlay?c? comment i?levsel olur!

var __dir = pathP.join(__dirname, "/..", "public", "uploads");
var decompressZip= function(file, callback)
{
    var zip = new AdmZip(file); //ADM Zip is a external Node.js module
    var target = file.substr(0, file.length-4);
    var zipEntries = zip.getEntries();  //Returns a list of files inside the zip.
    mkdrip(target, function (err) {
        if (!err) {
            zip.extractAllTo(target, true); //1st param: target folder, 2nd param: enable overwrite file.
            callback(false, zipEntries);
        }else
            callback(true);
    });
};

var compressZip= function(uploadedFolder, fileList, callback) {
    var zip = new AdmZip();
    var path = pathP.join(__dir , uploadedFolder);
    fileList.forEach(function (entry) {
        zip.addLocalFile(pathP.join(path , entry.entryName));   //Add files to zip file list.
    });
    zip.writeZip(__dir + "/" + uploadedFolder + ".zip", function (err) {    //Write file list to disk in zip format.
        if(!err){
            callback(false);
        }else
            callback(err);
    });
};

var findInEntryList = function (entryList, file, callback) {
    var entryIndex = -1;
    for(var i = 0; i < entryList.length; i++) {
        if (entryList[i].entryName === file) {
            entryIndex = i;
            break;
        }
    }
    callback(i);
}

var validateXML= function(uploadedFolder, fileList, tagName, callback) {
    var errorLog = [],
        warningFileList = [],
        successLog = {files: {}},
        filesToEdit = [];

    checkForMacFiles(fileList, function (err, newFileList, toBeDeletedMacs) {
        if(!err && tagName) {
            fileList.forEach(function (entry, index) {  //Validate every file one by one.
                var file = pathP.join(__dir, uploadedFolder, entry.entryName),
                    filename = entry.entryName,
                    fileExt = filename.substr(filename.lastIndexOf("."), filename.length - filename.lastIndexOf("."));
                fileList = newFileList;
                if (entry != null && (fileExt === '.xml')
                    && (filename.indexOf("MACOSX") == -1) && !fs.lstatSync(file).isDirectory()) {
                    fs.readFile(file, 'utf8', function (err, data) {
                        if (!err && data !== undefined && data !== null) {
                            var doc = new xmldom({  //Configure xmldom.
                                errorHandler: {
                                    warning: function (err) {
                                        console.log(err);
                                    },
                                    error: function (err) {
                                        if (warningFileList.indexOf(filename) < 0) {
                                            errorLog.push("Warning! File or Syntax might be corrupt:" + filename);
                                            warningFileList.push(filename);
                                        }
                                    },
                                    fatalError: function (err) {
                                        errorLog.push("ERROR! ?:\t" + " \tFile: \t" +filename + "\t" +  err );
                                        console.log(err + "\t Filename" + filename);
                                    }
                                }
                            }).parseFromString(data, "text/xml");   //Create a new dom document from xml with external module xmldom.

                            fixXML(doc, tagName, uploadedFolder, filename, successLog, function (err, fileToWrite) {
                                if (!err) {
                                    try {   //Write files synchronous.
                                        fs.writeFileSync(file, fileToWrite, {flags: 'w'});
                                        if ((fileList.length - 1) === index) {
                                            callback(false, successLog, errorLog, filesToEdit, toBeDeletedMacs);
                                        }
                                    } catch (e) {
                                        errorLog.push("ERROR: \t" + filename + "\t could not be written to disk. Cause: " + e);
                                        if ((fileList.length - 1) === index) {
                                            callback(false, successLog, errorLog, filesToEdit, toBeDeletedMacs);
                                        }
                                    }
                                } else {
                                    if(fileToWrite != null)
                                        filesToEdit.push(filename);
                                    if ((fileList.length - 1) === index) {
                                        callback(false, successLog, errorLog, filesToEdit, toBeDeletedMacs);
                                    }
                                }
                            });
                        } else {
                            errorLog.push("Could not validate file: \t" + filename);
                            if ((fileList.length - 1) === index) {
                                callback(false, successLog, errorLog, filesToEdit, toBeDeletedMacs);
                            }
                        }
                    });
                } else if ((fileList.length - 1) === index) {
                    callback(false, successLog, errorLog, filesToEdit, toBeDeletedMacs);
                }
            });
        }else
            callback(true, successLog, errorLog, filesToEdit, toBeDeletedMacs);
    });
};

var fixXML= function (doc, tagName, rarname, filename, successLog, callback) {
    var nodes = doc.documentElement.getElementsByTagName(tagName);  //Get all elements by specified tag name.
    var isExist = false, requiresEdit = false;
    if(nodes.length > 0) {
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].childNodes[0] != undefined){
                for(var a = 0; a < nodes[i].childNodes.length; a++){
                    var uselessValue = nodes[i].childNodes[a].nodeValue;
                    if(nodes[i].childNodes[a].nodeType === 3 && uselessValue != " " && uselessValue != null && uselessValue != undefined && uselessValue.length >0){
                        var beforeValue = nodes[i].childNodes[a].data;
                        if((nodes[i].childNodes[a].nodeValue.indexOf("&") > -1 || nodes[i].childNodes[a].data.indexOf("&") > -1) && (beforeValue.length > 0)) {
                            nodes[i].childNodes[a].nodeValue = " ";
                            nodes[i].childNodes[a].data = " ";
                            isExist = true;
                        }
                        if(beforeValue != "\n" && nodes[i].childNodes[a].data.indexOf(beforeValue) > -1) {
                            if (filename in successLog.files) {
                                successLog.files[filename].events.push({
                                    tagNo: (i + 1),
                                    childNo: (a + 1),
                                    data: beforeValue,
                                    status: "NOT DELETED"
                                });
                            } else {
                                successLog.files[filename] = {events: [], url: "/XMLEdit/" + rarname + "/" + filename};
                                successLog.files[filename].events.push({
                                    tagNo: (i + 1),
                                    childNo: (a + 1),
                                    data: beforeValue,
                                    status: "NOT DELETED"
                                });
                            }
                            requiresEdit = true;
                        }
                        else if(nodes[i].childNodes[a].data.indexOf(beforeValue) === -1) {
                            var deletedContent = beforeValue.substr(0,1) + " " + beforeValue.substr(1, beforeValue.length-1);
                            if (filename in successLog.files) {
                                successLog.files[filename].events.push({
                                    tagNo: (i + 1),
                                    childNo: (a + 1),
                                    data: deletedContent,
                                    status: "DELETED"
                                });
                            } else {
                                successLog.files[filename] = {events: [], url: "/XMLEdit/" + rarname + "/" + filename};
                                successLog.files[filename].events.push({
                                    tagNo: (i + 1),
                                    childNo: (a + 1),
                                    data: deletedContent,
                                    status: "DELETED"
                                });
                            }
                        }
                    }
                }
            }
        }
        var serializer = new xmlSer();
        serializer.serializeToString(doc);  //Convert dom document to writable string.
        if(isExist)
            callback(false, doc, successLog);
        else if(requiresEdit)
            callback(true, doc, successLog);
        else
            callback(true, null, successLog);
    }else{
        callback(true, null, successLog);
    }
};

var deleteFile= function (filename) {
    var path = pathP.join(__dir  , filename);
    fs.unlink(path, function (err) {
        if(err){
            if(err.code === "EPERM"){   //EPERM = path is a directory error.
                fs.rmdir(path, function (err) {
                    if(err)
                        console.log("deleteFile: \t" + err);
                });
            }
        }
    });
};

var deleteAll= function(filename, fileList) {
    fileList.forEach(function (file) {
        deleteFile(filename.substr(0, filename.length-4) + "/"+ file.entryName, function (err) {
            if(err)
                console.log("Could not delete file: \t" + file.entryName);
        });
    });
    //Looks inside the folder for remaining empty directories.
    var execFile = require('child_process').execFile;
    execFile('find', [ pathP.join(__dir, filename.substr(0, filename.length-4)) ], function(err, stdout, stderr) {
        var file_list = stdout.split('\n');
        file_list.forEach(function (filePath) {
            fs.rmdir(filePath, function (err) {
                if(!err) {
                    console.log("Deleted: \t" + pathP.join(__dir, filename.substr(0, filename.length-4)));
                }else {
                    console.log("ERROR! \t" + pathP.join(__dir, filename.substr(0, filename.length-4)) + "\t" + err);
                }
            });
        });
    });
};

//Provides cross platform compatibility by checking inside the given zip for mac files.
var checkForMacFiles = function (fileList, callback) {
    var toBeDeleted = [];
    fileList.forEach(function (e, index) {
       if(e.entryName.indexOf("MACOSX") > -1) {
           toBeDeleted.push(e);
           fileList.splice(index, 1);
       }
    });
    callback(false, fileList, toBeDeleted);
};

var deleteChild = function (file, tag, tagNum, childNum, callback) {
    var isCorrupt = false,
        path = pathP.join(__dir, file);
    fs.readFile(path, 'utf8', function (err, data) {
        if(!err) {
            var doc = new xmldom({  //Configure xmldom.
                errorHandler: {
                    error: function (err) {
                        isCorrupt = true;
                    }
                }
            }).parseFromString(data, "text/xml");

            var nodes = doc.getElementsByTagName(tag);
            nodes[tagNum-1].childNodes[childNum-1].data = " ";
            nodes[tagNum-1].childNodes[childNum-1].nodeValue = " ";
            var serializer = new xmlSer();
            serializer.serializeToString(doc);
            fs.writeFile(path, doc, {flags: "w"}, function (err) {
                if(!err)
                    callback(false);
                else
                    callback("Cannot write file: " + path);
            });
        }else
            callback("Cannot read file: " + path);
    });
};

module.exports = {
    decompressZip: decompressZip,
    compressZip: compressZip,
    deleteFile: deleteFile,
    deleteAll: deleteAll,
    validateXML: validateXML,
    findInEntryList: findInEntryList,
    deleteChild: deleteChild
};