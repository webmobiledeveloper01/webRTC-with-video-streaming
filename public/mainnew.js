var socket ,iceConfig, optional, popid, yt_playlist, yt_id, yt_data, ytplayer, sChat;
var setmediaautoplay = 0;
var templink = 'BDf4fvubExc';
var defaultytsize = 'default';
var loadedyt = true;
var input_placeholder = false;
var onloaded = () => {
	ChatHobby.member(window,document);
};
var getid = (data) => {
	return document.getElementById(data); 
};
var getclass =(data) => {
	return document.getElementsByClassName(data);
};
var removeElement =(data) => {
	if(data != null && getid(data) != null) getid(data).remove();
};
var addClass = (element, classToAdd) => {
	var currentClassValue = element.className;
	if (currentClassValue.indexOf(classToAdd) == -1){
		if ((currentClassValue == null) || (currentClassValue === "")){
			element.className = classToAdd;
		}
		else {
			element.className += " " + classToAdd;
		}
	}
};
var removeClass = (element, classToRemove) => {
	var currentClassValue = element.className;
	if (currentClassValue == classToRemove){
		element.className = "";
		return;
	}
	var classValues = currentClassValue.split(" ");
	var filteredList = [];
	for (var i = 0 ; i < classValues.length; i++){
		if (classToRemove != classValues[i]){
			filteredList.push(classValues[i]);
		}
	}
	element.className = filteredList.join(" ");
};
var addZero = (x,n) => {
	while (x.toString().length < n) { x = "0" + x; }
	return x;
};
var grabtime = () => {
	var d = new Date();
	var h = addZero(d.getHours(), 2);
	var m = addZero(d.getMinutes(), 2);
	var s = addZero(d.getSeconds(), 2);
	var ms = addZero(d.getMilliseconds(), 3);
	return (h + ":" + m + ":" + s + ":" + ms);
};
var smart_input = {
	fetch : (rdata,ytid) => {
		yt_data = rdata;
		smart_input.talkto(ytid);
	},
	talkto : function(ytid){
		var key = 'AIzaSyCOpigmd7_wheCdxU7JFjHu9fkJ3J41-I4';
    	var s = "https://www.googleapis.com/youtube/v3/videos?id=" + ytid+ "&key=" + key + "&fields=items(id,snippet(channelId,title,categoryId),statistics)&part=snippet,statistics&alt=json";
		smart_data.open(apptype, s, false),smart_data.setRequestHeader(apphead, appdata),smart_data.send();
	},
	live_background : function(){
		return (window.XMLHttpRequest)? new XMLHttpRequest(): new ActiveXObject("MSXML2.XMLHTTP");
	}
};
var smart_data = smart_input.live_background();
smart_data.onreadystatechange = () => {
	if (smart_data.readyState==4 && smart_data.status==200){
		var section=JSON.parse(smart_data.responseText);
		var txt = yt_data.username + " has added " + section.items[0].snippet.title + " to Youtube's playlist!";
		var createboxx = document.createElement('div');
		if(yt_data.logged) createboxx.className = 'themefont member chat-relay-box crb-tip';
		else createboxx.className = 'chat-relay-box crb-tip';
		createboxx.onclick = () => { ytplayer.loadVideoById(section.items[0].id, 0, "large"); };
		createboxx.innerText = txt;
		getid('ch_chatbox').append(createboxx);
	}
};
var onYouTubePlayerAPIReady = () => {
	if(room_youtube != 'undefined' && room_youtube != '') templink = room_youtube;
	var ytlive = getid('ytlive');
	var yturlsrc = 'https://www.youtube-nocookie.com/embed/'+templink+'?autoplay='+setmediaautoplay+'&controls=2&iv_load_policy=3&modestbranding=0&rel=0&showinfo=1&enablejsapi=1&wmode=opaque&scheme=https&origin=https://chathobby.com';
	ytlive.src = yturlsrc;
	ytplayer = new YT.Player("ytlive");
	ytplayer.addEventListener("onReady",       onYouTubePlayerReady);
	ytplayer.addEventListener("onStateChange", onYouTubePlayerStateChange);
};
var onYouTubePlayerReady = (event) => {
	if(loadedyt){
		loadedyt = false;
		//console.clear();
		//console.log('%cWelcome to %cChat Hobby%c!', 'color: white; background: black;', 'color: white; background: black;', 'color: white; background: black;');
	}
};
var onYouTubePlayerStateChange = (event) => {
	if(event.data === 0) {
		ChatHobby.ytnextvideo();
	}
};
var loadYouTubeData = () => {
	var s = document.createElement("script");
	s.src = "https://www.youtube.com/player_api";
	s.innerText = "YTConfig = {'host': 'https://www.youtube.com'};";
    var before = document.getElementsByTagName("script")[0];
    before.parentNode.insertBefore(s, before);
};
var scrollChat = () => {
	var sChat = getid('ch_chatbox');
	sChat.scrollTop = sChat.scrollHeight - sChat.clientHeight;
};
var sendData = (data) => {
	if(data.length>=1 && data != null){
		if(data.includes('!')) checkCommand(data);
		if(!data.includes('!help') && !data.includes('!autoplay')) socket.emit('chat data', { type : 'message', message : data });
		getid('input').innerText = '';
	}
};
var checkCommand = (string) => {
	if(string != null && string != undefined && string.length>=1){
		var splitUp = string.split(/(\s+)/).filter( function(e) { return e.trim().length > 0; } );
		var text = splitUp[0];
		console.log(text);
		if(text != null && text != undefined && text.length>=1){
			var line = splitUp[1];
			if(text.includes('!room')){ var more = splitUp[2].toLowerCase(); if(more == undefined || more == '') more = null; else what = more.toLowerCase(); socket.emit('chat data', { type : 'room', action : action.toLowerCase(), type : type.toLowerCase(), what : what }); }
			else if(text.includes('!yt')){
				var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
				var matchch = text.match(regExp);
				if(mainvideo != null && mainvideo != undefined && mainvideo.length>=1) var matchch2 = mainvideo.match(regExp);
				if (matchch && matchch[2].length == 11) { emptynow = YouTubeGetID(emptynow); socket.emit('chat data', { type : 'youtube', message : emptynow, mainvideo : false }); ytplayer.playVideo(); setmediaautoplay = 1; }
				else if (emptynow.toLowerCase() == 'mainvideo' && matchch2 && matchch2[2].length == 11) { mainvideo = YouTubeGetID(mainvideo); socket.emit('chat data', { type : 'youtube', message : mainvideo, mainvideo : emptynow.toLowerCase() }); ytplayer.playVideo(); setmediaautoplay = 1; }
			}
			else if(text.includes('!autoplay')) chatdivs({ username : '', message : function () { var info; if(setmediaautoplay == 0){ setmediaautoplay = 1; info = 'Auto play is now (ON)!'; } else { setmediaautoplay = 0; info = 'Auto play is now (OFF)!'; } return info;}, classos : 'chat-relay-box crb-tip' });
			else if(text.includes('!trivia')) { socket.emit('chat data', { type : 'quiz', action : text.toLowerCase() }); }
			else if(text.includes('!roll')) { amount = line.replace('dice', ''); ChatHobby.rolldice(amount); }
			else if(text.includes('!pm')) { var long = string.substr(string.indexOf(' ')+1); long = long.substr(long.indexOf(' ')+1); socket.emit('chat data', { type : 'pm', uniqid : null, user : text, txt : long }); }
			else if(text.includes('!mute')) socket.emit('chat data', { type : 'mute', uniqid : null, user : text, time : line });
			else if(text.includes('!kick')) socket.emit('chat data', { type : 'kick', uniqid : null, user : text, time : line });
			else if(text.includes('!ban')) socket.emit('chat data', { type : 'ban', uniqid : null, user : text, time : line });
			else if(text.includes('!help')) {
				var txt = 'The Chat Commands are !yt, !autoplay, !room, !pm, !roll, !trivia';
				getid('ch_chatbox').append(creating_elements('div','chat-relay-box crb-tip',txt));
				txt = 'Type !yt URL - Public Option - to add yo playlist in room. Owner Option - MainVideo URL - Sets a new entnry video.';
				getid('ch_chatbox').append(creating_elements('div','chat-relay-box crb-tip',txt));
				txt = 'Type !autoplay - Public Option - toggles ON or OFF the option to make youtube player automatically. Value is also toggled when you press play.';
				getid('ch_chatbox').append(creating_elements('div','chat-relay-box crb-tip',txt));
				txt = 'Type !room admin add USERNAME - Owner Options - Admin/Mod Add/Remove/List USERNAME. Mod Options - Mod Add/Remove/List USERNAME.';
				getid('ch_chatbox').append(creating_elements('div','chat-relay-box crb-tip',txt));
				txt = 'Type !room theme color COLORNAME - Owner Option - Theme/Font Color COLORNAME.';
				getid('ch_chatbox').append(creating_elements('div','chat-relay-box crb-tip',txt));
				txt = 'Type !pm USERNAME - Public Option - to message a user in private. Only works in same room you pm from.';
				getid('ch_chatbox').append(creating_elements('div','chat-relay-box crb-tip',txt));
				txt = 'Type !roll 2dice - Public Option - You can roll anywhere from 1 to 30 dice at a single time. Optional word dice not needed in order to roll dice.';
				getid('ch_chatbox').append(creating_elements('div','chat-relay-box crb-tip',txt));
				txt = 'Type !trivia join - Public Option - You can quit anytime but to play you must join. Owner/Admin/Mod Option - Start/Stop  ';
				getid('ch_chatbox').append(creating_elements('div','chat-relay-box crb-tip',txt));
				scrollChat();
			}
		}
	}
};
var ChatHobby = {
	chatdivs :function (data) {
		var time = new Date();
		var createtitle = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
		var createtimestamp = document.createElement('div');
		createtimestamp.className = 'crb-timestamp';
		createtimestamp.title = createtitle;
		createtimestamp.innerText = createtitle;
		var txt = data.username + ': ' + data.message;
		var createdthis = creating_elements('div',data.classos,txt);
		createdthis.append(createtimestamp);
		getid('ch_chatbox').append(createdthis);
		scrollChat();
	},
	YouTubeGetID : function (url) {
		url = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
		return (url[2] !== undefined) ? url[2].split(/[^0-9a-z_\-]/i)[0] : url[0];
	},
	rolldice : function (amount) {
		if (amount.match(/\D/) == null) socket.emit('chat data', { type : 'rolldice', diced : amount });
	},
	Send : function (data){
		socket.emit(data);
	},
	Browser : function () {
		var isFirefox = !!navigator.mozGetUserMedia;
		var isChrome = !!navigator.webkitGetUserMedia;
		return ((isFirefox)?'FireFox':(isChrome)?'Chrome':false);

	},
	Setup : function (){
		socket = io();
		iceConfig = {
			'iceServers': [ { 'urls': 'stun:stun.l.google.com:19302' },
			{'urls': "stun:stun1.l.google.com:19302"},
			{'urls': "stun:stun2.l.google.com:19302"},
			{'urls': "stun:stun3.l.google.com:19302"},
			{'urls': "stun:stun4.l.google.com:19302"}]
		};
		var optional = { optional: [{ DtlsSrtpKeyAgreement: true }]};
	},
	member : function (content,page){
		const selectElement = page.getElementById('room-select');
		const roomTitleElement = page.getElementById('room-title');
		const roomUserListElement = page.getElementById('ch_nicknames');
		const localVideoElement = page.getElementById('ch_previewstream');
		this.Setup();
		let localStream = undefined;
		let peerConnection = new RTCPeerConnection(iceConfig, optional);
		let openConnections = {};
		let peerConnections = {};
		var selectedRoom = null;
		var callingUser = null;
		var isAlreadyCalling = false;
		var constraints = { audio: true, video: true };
		updateRooms = rooms => {
			var str = "<option>-</option>";
			for (var room of rooms) { str += "<option valiue=\"" + room + "\">" + room + "</option>"; }
			selectElement.innerHTML = str;
		};
		resetRoom = () => {
			selectedRoom = null;
			roomTitleElement.textContent = null;
			roomUserListElement.innerHTML = null;
		};
		selectRoom = room => {
			createConnection();
			resetRoom();
			roomTitleElement.textContent = room;
			selectedRoom = room;
		};
		createConnection = (data) => {
			peerConnection = new RTCPeerConnection(iceConfig, optional);
			peerConnection.ontrack = function({ streams: [stream] }) {
				addRemoteVideo(stream);
			};
			/*
			peerConnection.onaddstream = function (e) {
				addRemoteVideo(e.stream);
			};
			*/
			peerConnection.onicecandidate = function(event) {
				if (!callingUser) { return; }
				if (event.candidate) {
					socket.emit("ice", { candidate: event.candidate, to: callingUser });
				}
			}
		};
		buildMenu = (data) => {
			var first = document.createElement("div");
				first.id = 'room_user_'+data.id;
				first.className = 'menu-nickname';
			var second = document.createElement("div");
				second.id = data.id;
				second.className = 'mn-gender';
				second.title = 'Gender';
				second.innerHTML = '&nbsp;';
			var third = document.createElement("div");
				third.id = 'room_nick_'+data.id;
				third.className = 'mn-holder font themefont';
				third.innerText = data.username;
				third.title = data.username;
			var fourth = document.createElement("div");
				fourth.className = 'mn-controls';
			var fifth = document.createElement("div");
				fifth.id = data.id;
				fifth.className = ((data.streaming)?'live streaming':'live');
				fifth.title = (data.streaming)?'Streaming':'Not Streaming';
				fifth.onclick = (event) => {
					if (!data.streaming || (callingUser && callingUser == data.id)) { return; }
					createConnection();
					isAlreadyCalling = false;
					popid = { username : data.username, id : data.id };
					callingUser = data.id;
					callUser(data.id);
				};
				fifth.innerHTML = '&nbsp;';
			var sixth = document.createElement("div");
				sixth.id = data.id;
				sixth.className = 'block';
				sixth.title = 'Block User';
				sixth.innerHTML = '&nbsp;';
			first.appendChild(second);
			first.appendChild(third);
			first.appendChild(fourth);
			fourth.appendChild(sixth);
			fourth.appendChild(fifth);
			getid('ch_nicknames').appendChild(first);
		};
		addRemoteVideo = (stream) => {
			peerID = popid.id;
			var first = document.createElement("div");
				first.id = 'stream-ch-' + peerID;
				first.className = 'stream-ch';
			var second = document.createElement("div");
				second.id = 'nick_' + peerID;
				second.className = 'videonamebox font';
				second.innerText = popid.username;
			var third = document.createElement("div");
				third.className = 'videobox';
				third.title = 'Close';
				third.onclick = () => { if(openConnections[peerID]) openConnections[peerID].close(); removeElement('stream-ch-' + peerID); };
				third.innerHTML = '&nbsp;';
			var fourth = document.createElement("video");
				fourth.id = 'ch_stream' + peerID;
				fourth.autoplay = 'true';
				fourth.muted = true;
				fourth.poster = 'loading.gif';
				fourth.srcObject = stream;
			first.append(second);
			first.append(third);
			first.append(fourth);
			getid('live-streams').append(first);
		};
		chatdivs = (data) => {
			var time = new Date();
			var createtitle = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
			var createtimestamp = document.createElement('div');
			createtimestamp.className = 'crb-timestamp';
			createtimestamp.title = createtitle;
			createtimestamp.innerText = createtitle;
			var txt = data.username + ': ' + data.message;
			var createdthis = creating_elements('div',data.classos,txt);
			createdthis.append(createtimestamp);
			getid('ch_chatbox').append(createdthis);
			scrollChat();
		};
		creating_elements = (type,c,txt) => {
			var createbox = document.createElement(type);
			createbox.className = c;
			createbox.innerText = txt;
			return createbox;
		};
		async function callUser(socketId) {
			peerConnection.addTransceiver('audio');
			peerConnection.addTransceiver('video');
			const offer = await peerConnection.createOffer({offerToReceiveVideo: true, offerToReceiveAudio: true, mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true }});
			var desc = new RTCSessionDescription(offer);
			await peerConnection.setLocalDescription(desc);
			socket.emit("call-user", { offer, to: socketId });
		};
		updateUsers = users => {
			roomUserListElement.innerHTML = '';
			var counter = 0;
			users.forEach(data => {
				counter++;
				let { streaming } = data;
				data.streaming = ((streaming)?true:false);
				buildMenu(data);
				getid('alertbubble1').innerText = counter;
			});
		};
		page.addEventListener("DOMContentLoaded", event => { 
			createConnection();
			socket.emit('chat ping',true);
			console.log('%cPing : %c' + grabtime(), 'color: white; background: black;', 'color: white; background: black;');
			setInterval(() => {
				let keys = Object.keys(openConnections);
				for(var i = 0; i < keys.length; i++) {
					if(!openConnections[keys[i]]) { return; }
					if (openConnections[keys[i]].connectionState === "failed" || openConnections[keys[i]].connectionState === "disconnected") {
						openConnections[keys[i]].close();
						openConnections[keys[i]] = undefined;
					}
				}
			}, 2000);
			selectElement.addEventListener('change', event => {
				socket.emit('select room', { room: event.target.value }, room => { selectRoom(room); });
			});
			getid('input').addEventListener("keydown", (event) => {
				e = event || window.event;
				if (e.keyCode === 13) {
					if(!input_placeholder) getid('input').placeholder='',input_placeholder = true;
					sendData(getid('input').innerText);
					e.preventDefault();
				}
			});
			page.getElementById('chathobby_send').onclick = () => {
				sendData(getid('input').innerText);
			};
			page.getElementById('start-stream').onclick = async () => {
				if (!selectedRoom) { return; }
				getid('ch_devices').style.display = 'block';
				localVideoElement.onloadedmetadata = () => { 
					getid('ch_loading').style.display = 'none';
					getid('ch_prev').style.display = 'block';
					localVideoElement.play();
					getid('streamersbutton').disabled = false;
				};
				navigator.mediaDevices.getUserMedia(constraints)
				.then(function(stream) {
					localStream = stream;
					localVideoElement.srcObject = stream;
				})
				.catch(function(err) { });
			};
			page.getElementById('ch_closeprev').onclick = () => {
				getid('ch_devices').style.display = 'none';
				getid('ch_loading').style.display = 'block';
				getid('ch_prev').style.display = 'none';
				localStream.getTracks().forEach(track => track.stop());
				localVideoElement.srcObject = null;
			};
			page.getElementById('streamersbutton').onclick = async (e) => {
				localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
				//peerConnection.addStream(localStream);
				socket.emit('start stream', { room: selectedRoom });
				e.disabled = true;
				getid('ch_stream').srcObject = localStream;
				getid('ch_stream').play();
				getid('ch_devices').style.display = 'none';
				addClass(getid('start-stream'),'streaming');
				addClass(getid('live-stream'),'streaming');
				addClass(getid('live-main-menu'),'streaming');
				addClass(getid('live-main-menu'),'header-closed');
			};
			page.getElementById('local-close-stream').onclick = () => { 
				localStream.getTracks().forEach(track => track.stop());
				localVideoElement.srcObject = null;
				getid('ch_stream').srcObject = null;
				removeClass(getid('start-stream'), 'streaming');
				removeClass(getid('live-stream'), 'streaming');
				removeClass(getid('live-main-menu'), 'streaming');
				removeClass(getid('live-main-menu'), 'header-closed');
				socket.emit('close local', { ChatHobby : 'Coded by Chris' });
			};
			socket.on('connect', function(){
				socket.emit('get rooms', null, rooms => { updateRooms(rooms); });
				if(newpage != undefined) {
					socket.emit('select room', { room : newpage }, room => { selectRoom(room); });
				}
			});
			socket.on('users changed', users => {
				//let filteredUsers = users.filter(x => x.id != socket.id);
				updateUsers(users);
			});
			socket.on('call-made', async data => {
				if (!localStream) { return; }
				let peerConnection;
				if (openConnections[data.socket]) peerConnection = openConnections[data.socket];
				else peerConnection = new RTCPeerConnection(iceConfig, optional);
				var desc = new RTCSessionDescription(data.offer);
				await peerConnection.setRemoteDescription(desc);
				const answer = await peerConnection.createAnswer();
				var desc2 = new RTCSessionDescription(answer);
				await peerConnection.setLocalDescription(desc2);
				peerConnection.onicecandidate = function(event) {
					if (event.candidate) socket.emit("ice", { candidate: event.candidate,  to: data.socket });
				}
				navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
					localStream = stream;
					localVideoElement.srcObject = localStream;
					//localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
					peerConnection.addStream(localStream);
					openConnections[data.socket] = peerConnection;
					socket.emit("make-answer", { answer, to: data.socket });
				})
				.catch(function(err) { });
				//localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
				//peerConnection.addStream(localStream);
				//openConnections[data.socket] = peerConnection;
				//socket.emit("make-answer", { answer, to: data.socket });
			});
			socket.on("answer-made", async data => {
				var desc = new RTCSessionDescription(data.answer);
				await peerConnection.setRemoteDescription(desc);
				if (!isAlreadyCalling) {
					callUser(data.socket);
					isAlreadyCalling = true;
				}
			});
			socket.on("ice-made", async data => {
				try {
					var pc;
					if (openConnections[data.socket]) pc = openConnections[data.socket];
					else pc = peerConnection;
					if (pc.remoteDescription && data.candidate) {
						var candidate = new RTCIceCandidate(data.candidate);
						await pc.addIceCandidate(candidate);
					}
				}
				catch (error) {
					console.log('err', error);
				}
			});
			socket.on("close stream", data => {
				removeElement('stream-ch-' + data.id);
			});
			socket.on("chat message", data => {
				var stored = function () {
					var info;
					if (data.type == 'message' || data.type == 'echo') info = data.message;
					else if (data.type == 'joined' || data.type == 'exited') {
						if(data.type == 'exited') {
							removeElement('stream-ch-' + data.id);
							if(openConnections[data.id]) openConnections[data.id].close();
						}
						info = " has just "+data.type+"!";
					}
					else if (data.type == 'muted' || data.type == 'unmuted') info = " has just been "+data.type+"!";
					else if (data.type == 'banned' || data.type == 'unbanned') info = " has just been "+data.type+"!";
					else if (data.type == 'youtube') { if (yt_playlist.includes(data.message) == false){ yt_playlist.push(data.message); smart_input.fetch(data,data.message); } }
					else if (data.type == 'background') { info = " has changed rooms Background!"; var preview = document.body; preview.style.backgroundImage = "url('"+data.message+"')"; preview.style.backgroundSize = "100% 100%"; }
					else if (data.type == 'style') { if(data.action == 'theme' && data.type == 'color'){ info = ' has changed Theme Color!'; var xch = getclass(data.action); for(var ich = 0; ich < xch.length; ich++) { xch[ich].style.backgroundColor = data.what; } } else if(data.action == 'font' && data.type == 'color'){ info = ' has changed Font Color!'; var txt = ' .member, .themefont { color: ' + data.what + '; text-shadow: 0 0 2px ' + data.what + '; } '; getid('ch_chatbox').append(creating_elements('style','',txt)); var xch = getclass('member'); for(var ich = 0; ich < xch.length; ich++) { xch[ich].style.color = data.what; xch[ich].style.textShadow = "0 0 2px " + data.what; } } }
					return info;
				};
				chatdivs({
					username : ((data.type == 'echo')?'':data.username),
					message : stored(),
					classos : (data.member) ? 'themefont member chat-relay-box '+((data.type == 'message')?'':'crb-tip') : 'chat-relay-box '+((data.type == 'message')?'':'crb-tip'),
				});
			});
			socket.on("chat pong", data => {
				console.log('%cPong : %c' + grabtime(), 'color: white; background: black;', 'color: white; background: black;');
				setTimeout(function () { socket.emit('chat ping',true); console.log('%cPing : %c' + grabtime(), 'color: white; background: black;', 'color: white; background: black;');  } , 15000);
			});
		});
	}
};