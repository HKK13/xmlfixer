var express = require('express');
var busboy = require('connect-busboy'); //Module that handles multipart/form data.
var fs = require('fs');
var xmlParser = require('./XmlParser'),
    path = require('path'),
    xmlEditor = require('./xmlEditor'),
    walk = require('walk');

var router = express.Router();

router.use(busboy());


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Translation Validator'});
});


router.post('/XMLZipUploads', function (req, res) {
  var __dir = path.join(__dirname, "/..", "public", "uploads");
  var fstream;
  var tag;
  req.pipe(req.busboy); //Busboy handles multipart/form data -> more than 1 packages, for example image of data.

  req.busboy.on('field', function (fieldname, val) { //Fired when a field is received (e.g. filename of file from the submitted form in front end.)
      tag = val;
  });
  req.busboy.on('file', function (fieldname, file, filename) { //Fired when a file is received.
    var temp = filename;

    if ((temp.split(".").pop() === "zip")) { //Check extension of file(Continue if it is a zip.).
      fstream = fs.createWriteStream(__dir + '/' + filename); //Write file into upload folder.
      file.pipe(fstream);
      fstream.on('close', function () { //When finished
        xmlParser.decompressZip(__dir + '/' + filename, function (e, zipEntries) {
          xmlParser.deleteFile(filename); //Delete zip file after uncompressed it.
          //Start of main purpose.
          xmlParser.validateXML(filename.substr(0, filename.length - 4), zipEntries, tag, function (err, successes, errorLog, fileList, macZips) {
            if (!err) {
              res.json({redirectUrl: filename, successLog: successes, errors: errorLog, fileList: fileList}).send();
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
      fstream.on('error', function (err) { //Exception handling for filestream exceptions!
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


router.get('/Download/:file(*)', function (req, res) { //Download specified file in the url after "localhost:3000/Download/asd.zip" -> asd.zip in this case.
  var file = req.params.file,
      files   = [],
      directories = [];
  file = file.substr(0, file.length-4); //Get rid of file extension.
  var filePath = path.join(__dirname, "/..", "public", "uploads", file); //Get path of file.
  var walker  = walk.walk(filePath, { followLinks: false }); //Walker -> searches inside of folder.
  walker.on("directories", function (root, dirStatsArray, next) { //Get directories into list.
    directories.push(dirStatsArray)
    next();
  });
  walker.on('file', function(root, stat, next) { //Get files into list.
    files.push({entryName: stat.name});
    next();
  }); //File üzerinde walk eden walker eventi.
  walker.on('end', function() { //When walking finished.
    xmlParser.compressZip(file, files, function (err) { //Compress files in the list.
      if(!err) {
        xmlParser.deleteAll(req.params.file, files); //Delete all files in list after compressed into file.
        res.download(filePath + ".zip", function (err) {//Send file.
          if (!err) {
            xmlParser.deleteFile(req.params.file, function (err) {//Delete last remaining file which is zip.
              if (!err)
                console.log("File Deleted: " + file);
              else
                console.log("Could not delete file: " + filePath);
            });
          }
        });
      }
    });
  });
});


router.get('/Help', function (req, res) { //Render help.jade.
  res.render('help', {title: "Help"});
});

module.exports = router;
