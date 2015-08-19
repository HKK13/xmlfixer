/**
 * Created by Kaan on 17/08/15.
 */
var express = require('express');
var busboy = require('connect-busboy');
var fs = require('fs');
var xmlParser = require('./XmlParser'),
    path = require('path'),
    xmlEditor = require('./xmlEditor');

var router = express.Router();


router.get('/:zip/:xml', function (req, res) {
    xmlEditor.readXmlFile(req.params.zip, req.params.xml, function (err, data) {
        res.render('editor', {title: "XML Editor", text: data, file: req.params.xml, folder: req.params.zip});
    });
});

router.post('/', function (req, res) {
    console.log(req.body);
    xmlEditor.writeXmlFile(req.body.folderName, req.body.fileName, req.body.fileData, function (err) {
        if(!err) {
            xmlEditor.readXmlFile(req.body.folderName, req.body.fileName, function (err, data) {
                if (!err) {
                    res.render('editor', {
                        title: "XML Editor",
                        text: data,
                        file: req.body.fileName,
                        folder: req.body.folderName,
                        status: "Success"
                    });
                } else {
                    res.render('editor', {
                        title: "XML Editor",
                        text: data,
                        file: req.body.fileName,
                        folder: req.body.folderName,
                        status: "Failed to read."
                    });
                }
            });
        }else{
            res.render('editor', {
                title: "XML Editor",
                text: "",
                file: "",
                folder: "",
                status: "Failed to write."
            });
        }
    });
});

module.exports = router;