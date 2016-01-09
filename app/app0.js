//Load Dependencies
var fs= require('fs');
var omx = require('./omx');
var express = require('express');
var socket  = require('socket.io');
var path = require('path');

//Start web server
var app=express();
var server = app.listen(80);
var io = socket.listen(server);

//Define Variables

var dir = __dirname + "/media"; //Media Folder
//omx.setVideosDirectory(dir);
var currentVideo
var preload=false //Allows auto-pausing of videos on start, cuts load times
var lengths = {'dummy':0}
// Define all OMXPlayer button commands
function stopClicked(data){
  //console.log("stop");
  omx.stop();
  //console.log(data);
};
function playClicked(data){
 if (omx.getStatus().current!= (dir + '/' + mp4s[data.id]) ) {
   omx.stop();
   console.log('stopped')
   setTimeout(function(){dir+omx.play(mp4s[data.id],{'-s': true, '-I': true});
   currentVideo = mp4s[data.id]
   omx.emit('progress',0)}, 300)
 } else {
   omx.play(dir+mp4s[data.id],{'-s': true, '-I': true})
   currentVideo = dir+mp4s[data.id]
   omx.emit('progress',0)

 }
 //console.log(omx.getStatus().current)
 //console.log(dir + / + mp4s[data.id])
//  omx.play(mp4s[data.id]);
  console.log('played')
  ////console.log('play command for ' + mp4s[data.id]);
};
function pauseClicked(data){
  //console.log("Pause");
  omx.pause();
  console.log('pause clicked')
  //console.log(data);
};
function initClicked(data){
  //console.log("Init");
  omx.stop();
  console.log('init stopped vid')
  console.log("Preload set true by init")
  preload=true;
  setTimeout(function(){

    console.log('about to video play by init timeout');

    omx.play(dir+mp4s[data.id],{'-s': true, '-I': true});
    currentVideo = dir+mp4s[data.id];


  omx.emit('progress',0)}
, 1000);

  //console.log(data);
};


//This runs the preload, pausing videos as soon as they start
omx.on('load', function(videos){
  console.log('video loaded')
  if (preload==true){omx.pause();
    preload=false;
  console.log('video paused by preload')};
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
  var data = {'files': getFolderList(dir,"mp4"), 'lengths':lengths};
  res.render('pages/index.ejs',data);
  mp4s = getFolderList(dir,"mp4")
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
  omx.on('progress',function(data){
    console.log('progress socket sent')
    io.emit('progress', {'current':data,'total':totalTime,'video': currentVideo})
  });

  omx.on('totaltime',function(data){
      console.log('totaltime socket sent')
      io.emit('totaltime',data)});

});

console.log("listening on port 80") //Confirm end of processing file
var totalTime
omx.on('progress',function(data){console.log(data)})
omx.on('totaltime',function(data){
  totalTime = data;
  console.log('total time')
  lengths[currentVideo] = data
  console.log(currentVideo)
  console.log(lengths)
})

//var timer = setInterval(function(){console.log(omx.getStatus())}, 2000)
