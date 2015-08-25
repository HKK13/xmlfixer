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


router.get('/:zip/:xml/:tagname/:tagno', function (req, res) { // :tagno -> defines a parameter (e.g. localhost:3000/asd/qwe/zxc/rty)  tagno == zxc. Can get parameters as req.params.tagno which equals to "zxc".
    xmlEditor.readXmlFile(req.params.zip, req.params.xml, function (err, data) {
        xmlEditor.getCaretPos(data, req.params.tagname, req.params.tagno, req.params.childno, function (pos, end) {
            res.render('editor', {title: "XML Editor: " + req.params.xml, text: data, file: req.params.xml, folder: req.params.zip, tagname: req.params.tagname, tagno: req.params.tagno, childno: req.params.childno, caret: pos, caretEnd: end});
        })
    });
});

router.post('/', function (req, res) {
    xmlEditor.writeXmlFile(req.body.folderName, req.body.fileName, req.body.fileData, function (err) { //Can get parameters from req.body fro post method.
        if(!err) {
            xmlEditor.readXmlFile(req.body.folderName, req.body.fileName, function (err, data) {
                if (!err) {
                    res.render('editor', { //res.render mean render jade file into html. Basically shows html page. editor.jade is rendered in this case.
                        title: "XML Editor: " + req.body.fileName,
                        text: data,
                        file: req.body.fileName,
                        folder: req.body.folderName,
                        status: "Success"
                    });
                } else {
                    res.render('editor', {
                        title: "XML Editor: " + req.body.fileName,
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