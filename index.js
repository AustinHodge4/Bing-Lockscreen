#! /usr/bin/env nodejs
'use strict';

var Cron = require('cron');
var Moment = require('moment-timezone');
let https = require('https');
var fs = require('fs');
var request = require('request');
const shell = require('shelljs');

var subscriptionKey = '65b6410d6cd94dc99b00e719c1dc5b40';
var searchQueries = ['Windows Spotlight Wallpapers', 'Most Beautiful Landscapes', 'Most Breathtaking Views'];
    //'Greatest Architectural Buildings hd', 

var runningJob = new Cron.CronJob(
    '0 */45 * * * *',  // s(0-59) m(0-59) h(0-23) d(1-31) m(0-11) w(0-6)
    function(){
        chooseBackground();
    },
    function(){
        // Job has stopped
    },
    false, // Start job later
    Moment.tz.guess()
);
function chooseBackground(){
    let host = 'api.cognitive.microsoft.com';
    let path = '/bing/v7.0/images/search';
    let chosenImage = '';
    let response_handler = function (response) {
        let body = '';
        response.on('data', function (d) {
            body += d;
        });
        response.on('end', function () {
            //console.log('\nRelevant Headers:\n');
            //for (var header in response.headers)
                // header keys are lower-cased by Node.js
                //if (header.startsWith("bingapis-") || header.startsWith("x-msedge-"))
                  //   console.log(header + ": " + response.headers[header]);
            
            let images = JSON.parse(body)
            let result = JSON.stringify(images, null, '  ');
            
            var links = "";
            let paths = [];
            for (let img in images.value){
                links += images.value[img].contentUrl + '\n';
                paths.push(images.value[img].contentUrl);
            }
            var randomIndex = Math.floor(Math.random() * paths.length);
            chosenImage = paths[randomIndex];
            while(!chosenImage.endsWith('.jpg')){
                randomIndex = Math.floor(Math.random() * paths.length);
                chosenImage = paths[randomIndex];
            }
            console.log(chosenImage);
            
            
            var download = function(uri, filename, callback){
                request.head(uri, function(err, res, body){
                  //console.log('content-type:', res.headers['content-type']);
                  //console.log('content-length:', res.headers['content-length']);
              
                  request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
                });
              };
              
              download(chosenImage, 'chosenImage.jpg', function(){
                console.log('...Setting Background...');
                let pictureFilePath = 'file://'+__dirname + '/chosenImage.jpg';
                console.log('gsettings set org.gnome.desktop.background picture-uri '+ pictureFilePath+'');
                shell.exec('gsettings set org.gnome.desktop.background picture-uri '+pictureFilePath+'', function(stdout, stderr, std){
                    console.log(std);
                });
            });
            
            fs.writeFile("response.txt", links, function(err) {
                if(err) {
                    return console.log(err);
                }
            
                console.log("...Saving links to file...");
            }); 
        });
        response.on('error', function (e) {
            console.log('Error: ' + e.message);
        });
    };
    let bing_web_search = function (search) {
        console.log('Searching the Web for: ' + search);
        let request_params = {
              method : 'GET',
              hostname : host,
              path : path + '?q=' + encodeURIComponent(search) + '&aspect=wide&imageType=Photo&size=Wallpaper',
              headers : {
                  'Ocp-Apim-Subscription-Key' : subscriptionKey,
              }
          };
      
          let req = https.request(request_params, response_handler);
          req.end();
      };
      bing_web_search(searchQueries[Math.floor(Math.random() * searchQueries.length)]);
}

chooseBackground();
runningJob.start();