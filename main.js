const selectElement = document.getElementById('room-select');
const roomTitleElement = document.getElementById('room-title');
const roomUserListElement = document.getElementById('room-user-list');
const localVideoElement = document.getElementById('local-video');
const remoteVideoElement = document.getElementById('remote-video');

const socket = io();

let localStream = undefined;
let peerConnection = new RTCPeerConnection();
let openConnections = {};

var callingUser = null;

var isAlreadyCalling = false;

updateRooms = rooms => {
	var str = "<option>-</option>"
	for (var room of rooms) {
		str += "<option valiue=\"" + room + "\">" + room + "</option>"
	}

	selectElement.innerHTML = str;
}

resetRoom = () => {
	roomTitleElement.textContent = null;
	roomUserListElement.innerHTML = null;
}

selectRoom = room => {
	createConnection();

	resetRoom();

	roomTitleElement.textContent = room;
}

createConnection = () => {
	remoteVideoElement.srcObject = null;
	peerConnection.close();

	peerConnection = new RTCPeerConnection();

	peerConnection.ontrack = function({ streams: [stream] }) {
		 remoteVideoElement.srcObject = stream;
	};

	peerConnection.onicecandidate = function(event) {
	if (!callingUser) {
		return;
	}

	if (event.candidate) {
		socket.emit("ice", {
		   candidate: event.candidate,
		   to: callingUser
		 });
	}
	}
}

async function callUser(socketId) {
	// Safari
	peerConnection.addTransceiver('audio');
	peerConnection.addTransceiver('video');

	const offer = await peerConnection.createOffer({offerToReceiveVideo: true, offerToReceiveAudio: true, mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true }});

	await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
 
 	socket.emit("call-user", {
	   offer,
	   to: socketId
 	});
}

updateUsers = users => {
	var str = ""
	users.forEach(user => {
		let { streaming } = user;

		if (streaming) {
			str += "<li class=\"user-item streaming\">" + user.id + "</li>"
		} else {
			str += "<li class=\"user-item\">" + user.id + "</li>"
		}
	});

	roomUserListElement.innerHTML = str;

	let items = document.getElementsByClassName("user-item");

	for (var i = 0; i < items.length; i++) {
		let currentIndex = i;
	    items[currentIndex].onclick = () => {
	    	let user = users[currentIndex].id;

	    	if (!users[currentIndex].streaming || (callingUser && callingUser == user)) {
	    		return;
	    	}

	    	createConnection();

	    	isAlreadyCalling = false;
	    	callingUser = user;
	    	callUser(users[currentIndex].id);
	    }
	}

}

document.addEventListener("DOMContentLoaded", event => { 
	createConnection();

	// connection checking

	setInterval(() => {
		let keys = Object.keys(openConnections);

		for(var i = 0; i < keys.length; i++) {
			if(!openConnections[keys[i]]) {
				return;
			}

			console.log(openConnections[keys[i]].connectionState);

			if (openConnections[keys[i]].connectionState === "failed" || openConnections[keys[i]].connectionState === "disconnected") {
				openConnections[keys[i]].close();
				openConnections[keys[i]] = undefined;
			}
		}
	}, 2000);

	selectElement.addEventListener('change', event => {
	  	socket.emit('select room', { room: event.target.value }, room => {
			selectRoom(room);
		});
	});

	// Start streaming
	document.getElementById('start-stream-button').onclick = async () =>{
		try {
			socket.emit('start stream', { room: "Football" });

	    	localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

	    	localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

	    	localVideoElement.srcObject = localStream;
	  	} catch (e) {
	  		console.log(e);
	  	}
	}

	// Socket.io
	socket.on('connect', function(){
		socket.emit('get rooms', null, rooms => {
			updateRooms(rooms);
			
		});
	});

	socket.on('users changed', users => {
		console.log('u', users);
		let filteredUsers = users.filter(x => x.id != socket.id);
		updateUsers(filteredUsers);
	});

	socket.on('call-made', async data => {

		if (!localStream) {
			return;
		}

		let peerConnection;

		if (openConnections[data.socket]) {
			peerConnection = openConnections[data.socket];
		} else {
			peerConnection = new RTCPeerConnection();
		}
		
		await peerConnection.setRemoteDescription(
			new RTCSessionDescription(data.offer)
		);

		 const answer = await peerConnection.createAnswer();
		 await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

		 peerConnection.onicecandidate = function(event) {
		  if (event.candidate) {
		  	socket.emit("ice", {
			   candidate: event.candidate,
			   to: data.socket
			 });
		  }
		}
		 let stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

		 stream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

		 openConnections[data.socket] = peerConnection;
		 socket.emit("make-answer", {
		   answer,
		   to: data.socket
		 });
	});

	socket.on("answer-made", async data => {
		await peerConnection.setRemoteDescription(
		    new RTCSessionDescription(data.answer)
	    );

		if (!isAlreadyCalling) {
		    callUser(data.socket);
		    isAlreadyCalling = true;
		}
	});

	socket.on("ice-made", async data => {
		try {
			if (openConnections[data.socket]) {
				await openConnections[data.socket].addIceCandidate(new RTCIceCandidate(data.candidate));
			} else {
				await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
			}
		} catch (error) {
			console.log('err', error);
		}
	});
});