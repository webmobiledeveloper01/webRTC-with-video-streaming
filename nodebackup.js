'use strict';
var https 					= require('https');
var http 					= require('http');
var url 					= require('url');
var fs 						= require('fs');
var path 					= require('path');
var mysql 					= require('mysql');
var express 				= require('express');
var app 					= express();
var HTTPS_PORT 				= 443;
var HTTP_PORT 				= 80;
var ch_information = {
	email : 	'ChatHobby <ChatHobby@gmail.com>',	/* Gmail Email */
	pass : 		'*****', 							/* Gmail Password */
	host: 		'localhost', 						/* MySQL IP */
	user: 		'root', 							/* MySQL User */
	password: 	'****', 							/* MySQL Password */
	database: 	'merc0' 							/* MySQL Database */
};
app.use(express.static('public'));
app.set('views','views');
app.set('view engine', 'ejs');
app.get('/', function (req, res) {
	res.render('chathobby', {})
});
var serv = http.createServer(app);
var server = https.createServer({
	key: fs.readFileSync('./server.key'),
	cert: fs.readFileSync('./server.crt')
}, app);
var io = require('socket.io').listen(server);
var ioless = require('socket.io').listen(serv);

ioless.on("connection", function (socket) {
	new ChatHobby.WebRTC(ioless,socket);
});
io.on("connection", function (socket) {
	new ChatHobby.WebRTC(io,socket);
});
var ChatHobby = {
	Rooms : ['Lobby','Chat Life'],
	WebRTC : function (io,socket) {
		function updateRoomUsers(room) {
			io.in(room).clients(function (err , ids) {
				var clients = ids.map(function (id) {
					return { id: id, streaming: io.sockets.sockets[id].streaming};
				});
				io.in(room).emit('users changed', clients);
			});
		}
		function updateRoomsUsers() {
			ChatHobby.Rooms.forEach(function (room) {
				updateRoomUsers(room);
			});
		}
		var callUser = function (user) {
			var socket = io.sockets.sockets[user];
			if (!socket) {
				return;
			}
			socket.emit('accept offer', null, function (data) {
				console.log('back', data);
			});
		}
		socket.room = null;
		socket.streaming = false;
		socket.on('get rooms', function (socket, ackFn) {
			ackFn(ChatHobby.Rooms);
		});
		socket.on('select room', function (data, ackFn) {			
			var room = data.room;
			if (!room) {
				return;
			}
			var idx = ChatHobby.Rooms.indexOf(room);
			if (idx == -1) {
				return;
			}
			if (socket.room && socket.room !== room) {
				socket.leave(socket.room);
				socket.room = null;
			}
			socket.join(room);
			socket.room = room;
			ackFn(room);
			updateRoomsUsers();
		});
		socket.on('start stream', function () {
			socket.streaming = true;
			updateRoomUsers(socket.room);
		});
		socket.on("call-user", function (data) {
			socket.to(data.to).emit("call-made", {
				offer: data.offer,
				socket: socket.id
			});
		});
		socket.on("ice", function (data) {
			socket.to(data.to).emit("ice-made", {
				candidate: data.candidate,
				socket: socket.id
			});
		});
		socket.on("make-answer", function (data) {
			socket.to(data.to).emit("answer-made", {
				socket: socket.id,
				answer: data.answer
			});
		});
		socket.on('get rooms', function (socket, ackFn) {
			ackFn(ChatHobby.Rooms);
		});
		ChatHobby.Rooms.forEach(function (room) {
			io.sockets.in(room).on('leave', function () {
				updateRoomsUsers();
			})
		});
		socket.on('disconnect', function () {
			updateRoomUsers(socket.room);
			if (socket.room != null && socket.streaming){
				socket.to(socket.room).emit('exited', {
					socket: socket.id
				});
			}
		});
	}
};
serv.listen(HTTP_PORT, function () {
	console.log('Site Started on port 80');
});
server.listen(HTTPS_PORT, function () {
	console.log("Site Started on port 443");
});
