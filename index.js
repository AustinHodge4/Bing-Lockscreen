#! /usr/bin/env nodejs

const cron = require('cron');
const moment = require('moment-timezone');
const fs = require('fs');
const request = require('request');
const shell = require('shelljs');
const fetch = require('node-fetch');

const searchQueries = ['Windows Spotlight Wallpapers', 'Most Beautiful Landscapes', 'Most Breathtaking Views', 'best landscape photography', 'mountain view', 'great wall', 'famous castle', 'galaxy night', 'santorini sunset', 'views'];

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
      let google_image_search = function(query){
        console.log('Searching the Web for: ' + query);
        let image_index = Math.floor(Math.random() * 19) + 1
        let endpoint = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyD7IaKJRHEyiXmWdg9yKz-6ULYJBOSlYkM&cx=003800074670516219078%3Az7ex1om7zts&imgSize=huge&imgType=photo&num=1&searchType=image&q='+query+'&start='+image_index;

        fetch(endpoint).then(res => res.json())
        .then(json => {
            let image_url = json.items[0].link;
            var download = function(uri, filename, callback){
                request.head(uri, function(err, res, body){
                  console.log('content-type:', res.headers['content-type']);
                  console.log('content-length:', res.headers['content-length']);
                  // write image data to file and return callback on close/exit
                  request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
                });
            };
            // download the image and set ubuntu desktop background once done
            download(image_url, 'chosenImage.jpg', function(){
                console.log('...Setting Background...');
                let pictureFilePath = 'file://'+__dirname + '/chosenImage.jpg';
                shell.exec('gsettings set org.gnome.desktop.background picture-uri '+pictureFilePath+'', function(stdout, stderr, std){
                    console.log(stderr);
                });
            });
        })
      }
      // Search google with random search query from list
      google_image_search(searchQueries[Math.floor(Math.random() * searchQueries.length)]);
}

chooseBackground();
//runningJob.start();