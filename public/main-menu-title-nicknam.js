var socket ,iceConfig, popid;
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
			'iceServers': [
			{urls: navigator.mozGetUserMedia ? "stun:stun.services.mozilla.com" : "stun:stun.l.google.com:19302"},
			{urls: "stun:stun1.l.google.com:19302"},
			{urls: "stun:stun2.l.google.com:19302"},
			{urls: "stun:stun3.l.google.com:19302"}
			]
		};
	},
	addRemoteVideo : function (stream) {
		peerID = popid;
		var first = document.createElement("div");
			first.id = 'stream-ch-' + peerID;
			first.className = 'stream-ch';
		var second = document.createElement("div");
			second.id = 'nick_' + peerID;
			second.className = 'videonamebox font';
			second.innerText = peerID;
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
		getid('remotestreams').append(first);
	},
	member : function (content,page){
		const selectElement = page.getElementById('room-select');
		const roomTitleElement = page.getElementById('room-title');
		const roomUserListElement = page.getElementById('room-user-list');
		const localVideoElement = page.getElementById('local-video');
		const remoteVideoElement = page.getElementById('remote-video');
		this.Setup();
		let localStream = undefined;
		let peerConnection = new RTCPeerConnection();
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
			peerConnection = new RTCPeerConnection();
			peerConnection.onaddstream = function (e) {
				this.addRemoteVideo(e.stream,);
			};
			peerConnection.onicecandidate = function(event) {
				if (!callingUser) { return; }
				if (event.candidate) {
					socket.emit("ice", { candidate: event.candidate, to: callingUser });
				}
			}
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
			var str = ""
			users.forEach(user => {
				let { streaming } = user;
				if (streaming) str += "<li class=\"user-item streaming\" title=\""+user.username+"\">" + user.id + "</li>";
				else str += "<li class=\"user-item\" title=\""+user.username+"\">" + user.id + "</li>";
			});
			roomUserListElement.innerHTML = str;
			let items = page.getElementsByClassName("user-item");
			for (var i = 0; i < items.length; i++) {
				let currentIndex = i;
				items[currentIndex].onclick = () => {
					let user = users[currentIndex].id;
					if (!users[currentIndex].streaming || (callingUser && callingUser == user)) { return; }
					createConnection();
					isAlreadyCalling = false;
					popid = user;
					callingUser = user;
					callUser(users[currentIndex].id);
				}
			}
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
			page.getElementById('start-stream-button').onclick = async () => {
				if (!selectedRoom) { return; }
				navigator.mediaDevices.getUserMedia(constraints)
				.then(function(stream) {
					localStream = stream;
					peerConnection.addStream(stream);
					localVideoElement.srcObject = stream;
					socket.emit('start stream', { room: selectedRoom });
				})
				.catch(function(err) { });
			}
			socket.on('connect', function(){
				socket.emit('get rooms', null, rooms => { updateRooms(rooms); });
				if(newpage != undefined) socket.emit('select room', { room : newpage }, room => { selectRoom(room); });
			});
			socket.on('exited', function(data){
				removeElement('stream-ch-' + data.socket);
				if(openConnections[data.socket]) openConnections[data.socket].close();
			});
			socket.on('users changed', users => {
				let filteredUsers = users.filter(x => x.id != socket.id);
				updateUsers(filteredUsers);
			});
			socket.on('call-made', async data => {
				if (!localStream) { return; }
				let peerConnection;
				if (openConnections[data.socket]) peerConnection = openConnections[data.socket];
				else peerConnection = new RTCPeerConnection();
				var desc = new RTCSessionDescription(data.offer);
				await peerConnection.setRemoteDescription(desc);
				const answer = await peerConnection.createAnswer();
				var desc2 = new RTCSessionDescription(answer);
				await peerConnection.setLocalDescription(desc2);
				peerConnection.onicecandidate = function(event) {
					if (event.candidate) socket.emit("ice", { candidate: event.candidate,  to: data.socket });
				}
				peerConnection.addStream(localStream);
				openConnections[data.socket] = peerConnection;
				socket.emit("make-answer", { answer, to: data.socket });
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
		});
	},
	guest : function (content,page){
		const selectElement = page.getElementById('room-select');
		const roomTitleElement = page.getElementById('room-title');
		const roomUserListElement = page.getElementById('room-user-list');
		const localVideoElement = page.getElementById('local-video');
		const remoteVideoElement = page.getElementById('remote-video');
		this.Setup();
		let localStream = undefined;
		let peerConnection = new RTCPeerConnection();
		let openConnections = {};
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
		createConnection = () => {
			remoteVideoElement.srcObject = null;
			peerConnection.close();
			peerConnection = new RTCPeerConnection();
			peerConnection.ontrack = function({ streams: [stream] }) {
			remoteVideoElement.srcObject = stream;
				/* remoteVideoElement.poster = 'loading.gif'; */
			};
			peerConnection.onicecandidate = function(event) {
				if (!callingUser) { return; }
				if (event.candidate) {
					socket.emit("ice", { candidate: event.candidate, to: callingUser });
				}
			}
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
			var str = ""
			users.forEach(user => {
				let { streaming } = user;
				if (streaming) str += "<li class=\"user-item streaming\">" + user.id + "</li>";
				else str += "<li class=\"user-item\">" + user.id + "</li>";
			});
			roomUserListElement.innerHTML = str;
			let items = page.getElementsByClassName("user-item");
			for (var i = 0; i < items.length; i++) {
				let currentIndex = i;
				items[currentIndex].onclick = () => {
					let user = users[currentIndex].id;
					if (!users[currentIndex].streaming || (callingUser && callingUser == user)) { return; }
					createConnection();
					isAlreadyCalling = false;
					callingUser = user;
					callUser(users[currentIndex].id);
				}
			}
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
			page.getElementById('start-stream-button').onclick = async () => {
				if (!selectedRoom) { return; }
				navigator.mediaDevices.getUserMedia(constraints)
				.then(function(stream) {
					localStream = stream;
					peerConnection.addStream(stream);
					//stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
					//localVideoElement.srcObject = stream;
					(typeof (localVideoElement.srcObject) !== 'undefined') ? localVideoElement.srcObject = stream : localVideoElement.src = URL.createObjectURL(stream);
					socket.emit('start stream', { room: selectedRoom });
				})
				.catch(function(err) { });
				/*
				try {

					localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
					localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
					localVideoElement.srcObject = localStream;
					socket.emit('start stream', { room: selectedRoom });
				}
				catch (error) {}
				*/
			}
			socket.on('connect', function(){
				socket.emit('get rooms', null, rooms => { updateRooms(rooms); });
			});
			socket.on('exited', function(data){
				var ele = page.getElementById('remote-video');
				ele.poster = 'end.gif';
				ele.srcObject = null;
				ele.load();
			});
			socket.on('users changed', users => {
				let filteredUsers = users.filter(x => x.id != socket.id);
				updateUsers(filteredUsers);
			});
			socket.on('call-made', async data => {
				if (!localStream) { return; }
				let peerConnection;
				if (openConnections[data.socket]) peerConnection = openConnections[data.socket];
				else peerConnection = new RTCPeerConnection();
				var desc = new RTCSessionDescription(data.offer);
				await peerConnection.setRemoteDescription(desc);
				const answer = await peerConnection.createAnswer();
				var desc2 = new RTCSessionDescription(answer);
				await peerConnection.setLocalDescription(desc2);
				peerConnection.onicecandidate = function(event) {
				if (event.candidate) socket.emit("ice", { candidate: event.candidate,  to: data.socket });
				}
				navigator.mediaDevices.getUserMedia(constraints)
				.then(function(stream) {
					peerConnection.addStream(localStream);
					//stream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
					openConnections[data.socket] = peerConnection;
					//localVideoElement.srcObject = stream;
					(typeof (localVideoElement.srcObject) !== 'undefined') ? localVideoElement.srcObject = stream : localVideoElement.src = URL.createObjectURL(stream);
					localVideoElement.onloadedmetadata = function(e) {
						localVideoElement.play();
					  };
					socket.emit("make-answer", { answer, to: data.socket });
				})
				.catch(function(err) { });
				/*
				let stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
				stream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
				openConnections[data.socket] = peerConnection;
				socket.emit("make-answer", { answer, to: data.socket });
				*/
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
		});
	}
};