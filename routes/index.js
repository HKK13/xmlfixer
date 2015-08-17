var express = require('express');
var busboy = require('connect-busboy');
var fs = require('fs');
var xmlParser = require('./XmlParser'),
    path = require('path');

var router = express.Router();

router.use(busboy());

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'XML Value Fixer'});
});

router.post('/XMLUpload', function (req, res) {
  var __dir = path.join(__dirname, "/..", "public", "uploads"),
  formArray = [];
  req.pipe(req.busboy);
  req.busboy.on('field', function (fieldname, val) {
    formArray[fieldname] = val;
    if(formArray["xmlFileSelect"] && formArray["tagNum"] && formArray["childNum"] && formArray["fileName"] && formArray["tagName"]) {
      xmlParser.decompressZip(__dir + "/" + formArray["fileName"], function (err, entryList) {
        if(!err) {
          xmlParser.deleteFile(formArray["fileName"]);
          xmlParser.findInEntryList(entryList, formArray["xmlFileSelect"], function (err) {
            if(err !== -1){
              console.log("File found");
              xmlParser.deleteChild(formArray["fileName"].substr(0, formArray["fileName"].length-4) + "/" +
              formArray["xmlFileSelect"], formArray["tagName"], formArray["tagNum"], formArray["childNum"], function (err) {
                if(!err){
                  console.log("Child Deleted");
                  xmlParser.compressZip(formArray["fileName"].substr(0, formArray["fileName"].length-4), entryList, function (err) {
                    if(!err){
                      console.log("File compressed");
                      res.json({
                        redirectUrl: formArray["fileName"],
                        serverMessage: " DELETED: Child: " + formArray["childNum"] + "   FROM: " + formArray["xmlFileSelect"] +  " - Tag Name: " + formArray["tagName"] + " - Tag No: " + formArray["tagNum"] + "."
                      }).send();
                      xmlParser.deleteAll( formArray["fileName"], entryList);
                    }else{
                      res.json({error: err}).send();
                    }
                  });
                }else{
                  res.json({error: err}).send();
                }
              });
            }else{
              res.json({error: err}).send();
            }
          });
        }else{
          res.json({error: err}).send();
        }
      });
    }
  });
});

router.post('/XMLZipUploads', function (req, res) {
  var __dir = path.join(__dirname, "/..", "public", "uploads");
  var fstream;
  var tag;
  req.pipe(req.busboy);

  req.busboy.on('field', function (fieldname, val) {
      tag = val;
  });
  req.busboy.on('file', function (fieldname, file, filename) {
    var temp = filename;

    if ((temp.split(".").pop() === "zip")) {
      fstream = fs.createWriteStream(__dir + '/' + filename);
      file.pipe(fstream);
      fstream.on('close', function () {
        xmlParser.decompressZip(__dir + '/' + filename, function (e, zipEntries) {
          xmlParser.deleteFile(filename);
          xmlParser.validateXML(filename.substr(0, filename.length - 4), zipEntries, tag, function (err, successes, errorLog, fileList, macZips) {
            if (!err) {
              xmlParser.compressZip(filename.substr(0, filename.length - 4), zipEntries, function (erro) {
                if (!erro) {
                  if (!erro) {
                    res.json({redirectUrl: filename, successLog: successes, errors: errorLog, fileList: fileList}).send();
                  }
                  else{
                    console.log("compressZip Callback: Cannot compress!");
                    errorLog.push("Problem in the server!");
                    res.json({redirectUrl: filename, successLog: successes, errors: errorLog, fileList: fileList}).send();
                  }
                  xmlParser.deleteAll(filename, zipEntries.concat(macZips));
                }
              });
            }else if(err && !tag){
              res.status(400).send("No tag specified.");
              xmlParser.deleteAll(filename, zipEntries.concat(macZips));
            }else{
              res.status(400).send("Unknown error.");
              xmlParser.deleteAll(filename, zipEntries.concat(macZips));
            }
          });
        });
      });
      fstream.on('error', function (err) {
        if (err.code === 'EISDIR')
          res.status(400).send("No File Sent.");
        else
          res.status(400).send("Unknown Error.");
        xmlParser.deleteAll(filename, zipEntries.concat(macZips));
      });
    }else{
      res.status(400).send("Bad File Request.");
    }
  });
});

router.get('/Download/:file(*)', function (req, res) { //TODO Check for non file.
  var file = req.params.file;
  var filePath = path.join(__dirname, "/..", "public", "uploads", "file");
  res.download(filePath, function (err) {
    if(!err) {
      xmlParser.deleteFile(file, function (err) {
        if (!err)
          console.log("File Deleted: " + file);
        else
          console.log("Could not delete file: " + filePath);
      });
    }
  });
});

router.get('/Help', function (req, res) {
  res.render('help', {title: "XML Fixer Help"});
});

module.exports = router;
