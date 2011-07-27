// setup

var express = require('express');
var sockets = require('socket.io');
var form = require('connect-form');
var redis = require("redis").createClient();

// create the server

var app = express.createServer(form({ keepExtensions: true }));
var socket = sockets.listen(app);
app.set('view engine', 'html');
app.set('view options', {layout: false});

// handle calls for html and js files

app.get('/*.(html|js)', function(req, res){

// if call for data.js, construct from redis saved values and send
	 
  if(req.url=="/data.js"){
    redis.get("players",function(e1,playerdata){
      redis.get("results",function(e2,resultsdata){
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("var data = "+resultsdata+";\nvar playerdata = "+playerdata+";\n");
      });
    });
  }else{
    res.sendfile("./public"+req.url);
  }
});

// return the main file

app.get('/', function(req, res){
    res.sendfile('./public/foosball.html');    
});

// open socket

socket.on('connection', function(client){ 
  client.on('message',function(data,e){

// if information passed to save and password correct then save to redis and tell other users to refresh browser

    if(data.password=="password"){
      redis.set("players", JSON.stringify(data.players), function(){
        redis.set("results", JSON.stringify(data.results), function(){socket.broadcast("data updated, please refresh browser to view");});
      });
    }else{
      client.send("password is incorrect");
    }
  });
});
app.listen(3000);

