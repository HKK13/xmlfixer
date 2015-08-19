var express = require('express');
var busboy = require('connect-busboy');
var fs = require('fs');
var xmlParser = require('./XmlParser'),
    path = require('path'),
    xmlEditor = require('./xmlEditor'),
    walk = require('walk');

var router = express.Router();

router.use(busboy());


//TODO : Kaan buralarda da ana index.js'te hangi ?artta fonksiyonlar nas?l �a??r?l?yor anlat?rsan iyi olur, mesela if caselerinin i�inde, ?u durumdaysa bu ifi yapar demek ilerde editlemeye kolayl?k :)

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Translation Validator'});
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


//File download edildi?inde buras? �al???yor, download fonksiyonu edit edilmi? file'?n sourcetan al?nmas?n? sa?l?yor.
router.get('/Download/:file(*)', function (req, res) { //TODO Check for non file.
  var file = req.params.file,
      files   = [],
      directories = [];
  file = file.substr(0, file.length-4);
  var filePath = path.join(__dirname, "/..", "public", "uploads", file);
  var walker  = walk.walk(filePath, { followLinks: false });
  walker.on("directories", function (root, dirStatsArray, next) {
    directories.push(dirStatsArray)
    next();
  });
  walker.on('file', function(root, stat, next) {
    files.push({entryName: stat.name});
    next();
  });
  walker.on('end', function() {
    console.log(files);
    xmlParser.compressZip(file, files, function (err) {
      if(!err) {
        xmlParser.deleteAll(req.params.file, files);
        res.download(filePath + ".zip", function (err) {
          if (!err) {
            xmlParser.deleteFile(req.params.file, function (err) {
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


router.get('/Help', function (req, res) {
  res.render('help', {title: "Help"});
});

module.exports = router;
