    var express = require('express');
    var app = express();
    var https = require("https");
    var timer = require("./my_modules/timer/timer.js");
    var http = require('http');
    var bodyParser = require('body-parser');
    var fs = require('fs');
    var request = require('request');


    var inputArray = [
          {cnn:'https://newsapi.org/v1/articles?source=cnn&sortBy?&apiKey=c6b3fe2e86d54cae8dcb10dc77d5c5fc'},
          {bbc:'https://newsapi.org/v1/articles?source=bbc-news&sortBy?&apiKey=c6b3fe2e86d54cae8dcb10dc77d5c5fc'},
          {guardian:'https://newsapi.org/v1/articles?source=the-guardian-uk&sortBy?&apiKey=c6b3fe2e86d54cae8dcb10dc77d5c5fc'},
          {recode:'https://newsapi.org/v1/articles?source=recode&sortBy?&apiKey=c6b3fe2e86d54cae8dcb10dc77d5c5fc'},
          {bbcsport:'https://newsapi.org/v1/articles?source=bbc-sport&sortBy?&apiKey=c6b3fe2e86d54cae8dcb10dc77d5c5fc',}
        ];

    var resultArray = []; //DO NOT modify ! harcoded in the result callback function
    var resultObj = {};
    var date = timer.dateShort();
    var lastUpdate = timer.dateFull();
    var currentFile = [];


    console.log("timer:    "+ date)

    app.set('port', (process.env.PORT || 5000));
    app.use(bodyParser.urlencoded({  extended: true }));
    app.use(bodyParser.json());
    app.use(express.static(__dirname));

    app.post('/admin/refresh', function(req, res) {
      console.log('Refresh!');
      res.redirect(303, '/admin');
    });




    app.get('/admin', function(req, res) {
      getJson(inputArray, result);
      res.render('admin.ejs',{date: date, resultArray: resultArray, resultObj:resultObj, lastUpdate: lastUpdate, dirList:dirList});

    });

    app.post('/admin/save/:id', function(req, res) {
      console.log(req.body, 'saving dataset!');
      save(resultArray, req.params.id);
      res.redirect(303, '/admin');
    });

    app.get('/admin/suppr/:id', function(req, res) {
        fs.unlinkSync('data/' + req.params.id + ".json");
        console.log("suppressing : " + req.params.id + ".json");
        res.redirect(303, '/admin');
    });

    app.get('/admin/edit/:id', function(req, res) {
        openFile(req.params.id, processFile);
        res.redirect(303, '/admin');
    });

    app.get('/admin/preview/:id', function(req, res) {
        openFile(req.params.id, processFile);
        res.redirect(303, '/admin');
    });



    app.get('/:id', function(req, res) {
      var object = require('./data/' + req.params.id + '.json');
      //res.send(JSON.stringify(object));
      res.render('pageview.ejs',{id:req.params.id, object: object});
    });


    app.use(function(req, res, next){
        res.setHeader('Content-Type', 'text/html');
        res.status(404).send('Page introuvable !');
        res.status(503).send('Page introuvable, erreur 503');
    });

    app.listen(app.get('port'), () => {
      console.log('We are live on port: ', app.get('port'));
      getJson(inputArray, result);

      });



    //external
    var count = 0;

    //not used...
    //function init(e){
    //  e = []
    //  console.log('initializing resultArray');
    //  let obj = {headlines: ["cnn.articles[0]", "bbc-news.articles[0]", "the-guardian-uk[0]"]};
    //  e.push(obj);
      //}


    //http request via request module
    function getJson(array, callback){

      request({
          url: array[count][Object.keys(array[count])],  //"simplest" way I found to iterate through array of object containing the urls
          json: true,
          callback:callback
          }, function(error, response, body) {
              if(count ==0){
                let md = {id: timer.dateShort(), genTime: timer.dateFull(), headlines: ["cnn.articles[0]", "bbc-news.articles[0]", "the-guardian-uk[0]"]};
                resultArray = [md];
                resultObj = {metadata:md, content:{}};
              };


              //if(error){console.log(error);}   //error management to be added to handle offline
              if(typeof(body) == "object"){
                 var src = body.source;
                 callback(body, src);}
          });
    }

    var result = function(e, src){

        var truc = src ;
        var obj = {};
        resultArray.push(e);
        resultObj["content"][truc] = e;
        console.log("    "+src + " : "+  JSON.stringify(e).substring(0, 14).replace(/:|{|}|"/g," ")   );
        lastUpdate = timer.dateFull();
        count++;                          //count is a global variable
          if(count == inputArray.length){   //hardcoded inputArray as it's not a parameter of the callback/result function..
                count = 0;
                jsonDir();                  // Recursive function
                console.log("   jsonDir");
            }

      else {
        getJson(inputArray, result);
      }

      };

function save(e, id){

    //console.log(  JSON.stringify(e).substring(0, 23).replace(/:|{|}|"/g," ") + e.source);
    lastUpdate = timer.dateFull();
    resultArray[0].id = id;
    console.log("okay ! " +  JSON.stringify(e));
      fs.writeFile("data/"+ id +".json", JSON.stringify(e), function (err) {
        if (err) throw err;
      });


};


var dirList = [];
function jsonDir(){
  dirList = [];
  fs.readdir('./data/', (err, files) => {      //data directory path hardcoded !!
    files.forEach(file => { exportJsonDirList(file);   });
  });

}


function exportJsonDirList(e){
  dirList.push(e);
}

//

function openFile(e, callback){
  fs.readFile("./data/"+e+".json", "utf8", function read(err, data){
      if(err){throw err}
      console.log("openfile: ./data/"+e+".json");
      var obj = JSON.parse(data);
      callback(obj);

  })

}

function processFile(e){
  resultArray = e ;
  console.log("open file type= " + typeof(e));
}
