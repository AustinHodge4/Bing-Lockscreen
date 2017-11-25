#! /usr/bin/env nodejs

const cron = require('cron');
const moment = require('moment-timezone');
const https = require('https');
const fs = require('fs');
const request = require('request');
const shell = require('shelljs');

const subscriptionKey = '65b6410d6cd94dc99b00e719c1dc5b40';
const searchQueries = ['Windows Spotlight Wallpapers', 'Most Beautiful Landscapes', 'Most Breathtaking Views', 'best landscape photography', 'mountain view', 'great wall', 'famous castle'];

var runningJob = new cron.CronJob(
    '0 */45 * * * *',  // s(0-59) m(0-59) h(0-23) d(1-31) m(0-11) w(0-6) Run every 45 minutes of the hour ex. 2:00, 2:45, 3:00, etc
    function(){
        // Job started so set background
        chooseBackground();
    },
    function(){
        // Job has stopped
    },
    false, // Start the job later
    moment.tz.guess()
);
function chooseBackground(){
    // Bing Search API Endpoints
    let host = 'api.cognitive.microsoft.com';
    let path = '/bing/v7.0/images/search';
    let chosenImage = '';

    let response_handler = function (response) {
        let body = '';
        response.on('data', function (d) {
            // Retrieve the json data
            body += d;
        });
        response.on('end', function () {
            // Convert the data to JSON object
            let images = JSON.parse(body)
            let result = JSON.stringify(images, null, '  ');
            
            let imgURLS = [];
            for (let img in images.value){
                imgURLS.push(images.value[img].contentUrl);
            }
            // Choose a random url from the image urls
            var randomIndex = Math.floor(Math.random() * imgURLS.length);
            chosenImage = imgURLS[randomIndex];
            console.log(chosenImage);
            
            var download = function(uri, filename, callback){
                request.head(uri, function(err, res, body){
                  console.log('content-type:', res.headers['content-type']);
                  console.log('content-length:', res.headers['content-length']);
                  // write image data to file and return callback on close/exit
                  request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
                });
              };
              // download the image and set ubuntu desktop background once done
              download(chosenImage, 'chosenImage.jpg', function(){
                console.log('...Setting Background...');
                let pictureFilePath = 'file://'+__dirname + '/chosenImage.jpg';
                shell.exec('gsettings set org.gnome.desktop.background picture-uri '+pictureFilePath+'', function(stdout, stderr, std){
                    console.log(stderr);
                });
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
      // Search bing with random search query from list
      bing_web_search(searchQueries[Math.floor(Math.random() * searchQueries.length)]);
}

chooseBackground();
runningJob.start();