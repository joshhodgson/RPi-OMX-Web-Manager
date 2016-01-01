//Load Dependencies
var fs= require('fs');
//var omx = require('omx-manager');

var omxobj = require('./omx.js')

var express = require('express');
var socket  = require('socket.io');
var path = require('path');

//Start web server
var app=express();
var server = app.listen(80);
var io = socket.listen(server);

//start omx stuff

var omx = omxobj.create({layer: 2})

//Define Variables

var dir = __dirname + "/media"; //Media Folder
//omx.setVideosDirectory(dir);

var preload=false //Allows auto-pausing of videos on start, cuts load times

// Define all OMXPlayer button commands
function stopClicked(data){
  //console.log("stop");
  omx.stop();
  //console.log(data);
};
function playClicked(data){
 /*if (omx.getStatus().current!= (dir + '/' + mp4s[data.id]) ) {
   omx.stop();
   console.log('stopped')
   setTimeout(function(){omx.play(mp4s[data.id])}, 300)
 } else {
   omx.play(mp4s[data.id])
 }*/
 omx.play(dir + '/'+mp4s[data.id])


 //console.log(omx.getStatus().current)
 //console.log(dir + / + mp4s[data.id])
//  omx.play(mp4s[data.id]);
  console.log('played')
  ////console.log('play command for ' + mp4s[data.id]);
};
function pauseClicked(data){
  //console.log("Pause");
  omx.pause();
  //console.log(data);
};
function initClicked(data){
  //console.log("Init");
  omx.stop();
  console.log('init stopped vid')
  preload=true;
  setTimeout(function(){
    omx.play(mp4s[data.id]);
    console.log('video played')
  }, 300); //compensate for omxplayer delays

  //console.log(data);
};


//This runs the preload, pausing videos as soon as they start
omx.on('load', function(videos){
  if (preload==true){omx.pause();preload=false};
});




//Find files in media folder matching 'ext' extension
  //TODO allow arrays of extensions
function getFolderList(dir, ext){
  var files=fs.readdirSync(dir) //Synchronous code preferred, shouldn't be a time issue
  var matches=[]
    for(i in files){
        matches.push(files[i]) //append each matching file
      }
    return matches
  };

var mp4s = getFolderList(dir,"mp4")//Initialize list of videos


//START WEB SERVER
app.set('view engine', 'ejs');
app.get('/', function(req, res){
  var data = {files: getFolderList(dir,"mp4")};
  res.render('pages/index.ejs',data);
});

app.get('/media/:id', function(req, res){
  var media = {name: getFolderList(dir,"mp4")[req.params.id], dir: dir, id:req.params.id}
  var data = {media};
  res.render('pages/media.ejs',data);
});

//Define all socket commands
io.on( "connection", function( socket ){
  console.log( "A user connected" );
  socket.on('stop', function(data){
    stopClicked(data)
  });
  socket.on('play', function(data){
    playClicked(data)
  });
  socket.on('pause', function(data){
    pauseClicked(data)
  });
  socket.on('init', function(data){
    initClicked(data)
  });
  omx.on('stop', function(videos){
    io.emit('stopped', true);
    console.log('omx stopped');
  });
});

console.log("listening on port 80") //Confirm end of processing file

var time
//var timer = setInterval(function(){console.log(omx.getStatus())}, 2000)
omx.on("progress", function(progress) {
  if (progress.last==0) {
    time=0
    setInterval(function(){
    time = time + 0.1
  }, 100)
}
//	console.log(progress);
  //console.log(progress.last.toString() + ' ' + time.toString())
  console.log(progress.last - time)
});
