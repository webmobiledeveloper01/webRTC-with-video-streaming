var socket ,iceConfig, optional, popid;
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
		var div = getid('ch_chatbox');
		div.scrollTop = div.scrollHeight - div.clientHeight;
	},
	YouTubeGetID : function (url) {
		url = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
		return (url[2] !== undefined) ? url[2].split(/[^0-9a-z_\-]/i)[0] : url[0];
	},
	rolldice : function (amount) {
		if (amount.match(/\D/) == null) socket.emit('rolldice', amount);
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
			var div = getid('ch_chatbox');
			div.scrollTop = div.scrollHeight - div.clientHeight;
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
				if(newpage != undefined) socket.emit('select room', { room : newpage }, room => { selectRoom(room); });
			});
			socket.on('exited', function(data){
				removeElement('stream-ch-' + data.socket);
				if(openConnections[data.socket]) openConnections[data.socket].close();
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
				chatdivs({
					username : data.username,
					message : function () {
						if (data.type == 'joined' || data.type == 'exited') return " has just "+data.type+"!";
						else if (data.type == 'muted' || data.type == 'unmuted') return " has just been "+data.type+"!";
						else if (data.type == 'banned' || data.type == 'unbanned') return " has just been "+data.type+"!";
						else if (data.type == 'background') return " has changed rooms Background!";
						else if (data.type == 'message') return data.message;
						
					},
					classos : (data.member) ? 'themefont member chat-relay-box '+((data.type == 'message')?'':'crb-tip') : 'chat-relay-box '+((data.type == 'message')?'':'crb-tip'),
				});
			});
		});
	}
};