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
var storedusers 			= {};
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
	res.render('chathobby', { page : ((req.query.room && ChatHobby.Rooms.includes(req.query.room)) ? req.query.room : 'default') });
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
		socket.username = ChatHobby.generateName();
		socket.color = '#0f277de8';
		socket.profile = {};
		socket.emit('chat message', { type : 'setup', color : socket.color, id : socket.id, username : socket.username });
		
		storedusers[socket.id] = socket.username;
		function updateRoomUsers(room) {
			io.in(room).clients(function (err , ids) {
				var clients = ids.map(function (id) {
					return { id: id, streaming: io.sockets.sockets[id].streaming, username : storedusers[id]  };
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
			socket.to(socket.room).emit('chat message', { type : 'joined', id : socket.id, username : socket.username });
			socket.emit('chat message', { type : 'joined', id : socket.id, username : socket.username });
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
		socket.on('close local', (data) => {
			socket.to(socket.room).broadcast.emit('close stream', { username : socket.username, id : socket.id });
		});
		ChatHobby.Rooms.forEach(function (room) {
			io.sockets.in(room).on('leave', function () {
				updateRoomsUsers();
			});
		});
		socket.on('disconnect', function () {
			updateRoomUsers(socket.room);
			if (socket.room != null && socket.streaming){
				socket.to(socket.room).emit('chat message', { type : 'exited', id : socket.id, username : socket.username });
				socket.emit('chat message', { type : 'exited', id : socket.id, username : socket.username });
			}
		});
		socket.on('chat ping', (message) => socket.emit('chat pong',true));
		socket.on("chat data", function (data) {
			if(data.type == 'room') {}
			else if(data.type == 'youtube') {
				if(data.id != null && data.id != undefined && data.id.length>=1){
				var gatheredID;
				var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
				var matchch = data.id.match(regExp);
					if (matchch && matchch[2].length == 11) { 
						gatheredID = matchch[2];
					}
					else {
						var url = data.id.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
						var yountube_id = (url[2] !== undefined) ? url[2].split(/[^0-9a-z_\-]/i)[0] : url[0];
						if (yountube_id.length == 11) gatheredID = yountube_id;
						else return;
					}
					socket.to(socket.room).emit('chat message', { type : 'youtube', message : gatheredID, id : socket.id,username : socket.username, color : socket.color });
					socket.emit('chat message', { type : 'youtube', message : gatheredID, id : socket.id,username : socket.username , color : socket.color });
				}
			}
			else if(data.type == 'profile image') {
				  socket.profile.image = data.message;
			}
			else if(data.type == '8ball') {
				var replies = ["It is certain.", "It is decidedly so.", "Without a doubt.", "Yes, definitely.", "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.", "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.", "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.", "Don't count on it.", "My reply is no.", "My sources say no.", "Outlook not so good.", "Very doubtful."];
				var random = Math.random();
    			var randomAnswer = Math.floor(random * replies.length);
				var answer = replies[randomAnswer];
				socket.to(socket.room).emit('chat message', { type : '8ball', message : answer, id : socket.id,username : socket.username, color : socket.color });
				socket.emit('chat message', { type : '8ball', message : answer, id : socket.id,username : socket.username, color : socket.color });
			}
			else if(data.type == urban) {}
			else if(data.type == 'quiz') {}
			else if(data.type == 'pm') {}
			else if(data.type == 'mute') {}
			else if(data.type == 'kick') {}
			else if(data.type == 'ban') {}
			else if(data.type == 'font color') {
				var has = ['red','darkred','black','darkgrey','grey','lightgrey','lightgreen','green','darkgreen','deeppink','pink','purple'];
				if (has.some(v => data.message.includes(v))) socket.color = data.message;
			}
			else if(data.type == 'message' && data.message.length>=1) {
				socket.to(socket.room).emit('chat message', { type : 'message', message : data.message, id : socket.id,username : socket.username, color : socket.color });
				socket.emit('chat message', { type : 'message', message : data.message, id : socket.id,username : socket.username, color : socket.color });
			}
			else if(data.type == 'rolldice' && data.diced.match(/\D/) == null){
				if(data.diced >= 1 && data.diced <= 30){
					var makedice = '';
					for(var i = 0; i < data.diced; i++) {
						var randnum = Math.floor((Math.random() * 6) + 1);
						if(randnum == 1) makedice += '⚀ ';
						else if(randnum == 2) makedice += '⚁ ';
						else if(randnum == 3) makedice += '⚂ ';
						else if(randnum == 4) makedice += '⚃ ';
						else if(randnum == 5) makedice += '⚄ ';
						else if(randnum == 6) makedice += '⚅ ';
					}
					socket.to(socket.room).emit('chat message', { type : 'rolldice', message : makedice, id : socket.id, username : socket.username, color : socket.color });
					socket.emit('chat message', { type : 'rolldice', message : makedice, id : socket.id, username : socket.username, color : socket.color });
				}
			}
		});
	},
	capFirst : function (string) {
		if (typeof string !== 'string') return ''
		return string.charAt(0).toUpperCase() + string.slice(1);
	},
	getRandomInt : function (min, max) {
		  return Math.floor(Math.random() * (max - min)) + min;
	},
	generateName : function () {
		var name = ["people","history","way","art","world","information","map","family","government","health","system","computer","meat","year","thanks","music","person","reading","method","data","food","understanding","theory","law","bird","literature","problem","software","control","knowledge","power","ability","economics","love","internet","television","science","library","nature","fact","product","idea","temperature","investment","area","society","activity","story","industry","media","thing","oven","community","definition","safety","quality","development","language","management","player","variety","video","week","security","country","exam","movie","organization","equipment","physics","analysis","policy","series","thought","basis","boyfriend","direction","strategy","technology","army","camera","freedom","paper","environment","child","instance","month","truth","marketing","university","writing","article","department","difference","goal","news","audience","fishing","growth","income","marriage","user","combination","failure","meaning","medicine","philosophy","teacher","communication","night","chemistry","disease","disk","energy","nation","road","role","soup","advertising","location","success","addition","apartment","education","math","moment","painting","politics","attention","decision","event","property","shopping","student","wood","competition","distribution","entertainment","office","population","president","unit","category","cigarette","context","introduction","opportunity","performance","driver","flight","length","magazine","newspaper","relationship","teaching","cell","dealer","debate","finding","lake","member","message","phone","scene","appearance","association","concept","customer","death","discussion","housing","inflation","insurance","mood","woman","advice","blood","effort","expression","importance","opinion","payment","reality","responsibility","situation","skill","statement","wealth","application","city","county","depth","estate","foundation","grandmother","heart","perspective","photo","recipe","studio","topic","collection","depression","imagination","passion","percentage","resource","setting","ad","agency","college","connection","criticism","debt","description","memory","patience","secretary","solution","administration","aspect","attitude","director","personality","psychology","recommendation","response","selection","storage","version","alcohol","argument","complaint","contract","emphasis","highway","loss","membership","possession","preparation","steak","union","agreement","cancer","currency","employment","engineering","entry","interaction","limit","mixture","preference","region","republic","seat","tradition","virus","actor","classroom","delivery","device","difficulty","drama","election","engine","football","guidance","hotel","match","owner","priority","protection","suggestion","tension","variation","anxiety","atmosphere","awareness","bread","climate","comparison","confusion","construction","elevator","emotion","employee","employer","guest","height","leadership","mall","manager","operation","recording","respect","sample","transportation","boring","charity","cousin","disaster","editor","efficiency","excitement","extent","feedback","guitar","homework","leader","mom","outcome","permission","presentation","promotion","reflection","refrigerator","resolution","revenue","session","singer","tennis","basket","bonus","cabinet","childhood","church","clothes","coffee","dinner","drawing","hair","hearing","initiative","judgment","lab","measurement","mode","mud","orange","poetry","police","possibility","procedure","queen","ratio","relation","restaurant","satisfaction","sector","signature","significance","song","tooth","town","vehicle","volume","wife","accident","airport","appointment","arrival","assumption","baseball","chapter","committee","conversation","database","enthusiasm","explanation","farmer","gate","girl","hall","historian","hospital","injury","instruction","maintenance","manufacturer","meal","perception","pie","poem","presence","proposal","reception","replacement","revolution","river","son","speech","tea","village","warning","winner","worker","writer","assistance","breath","buyer","chest","chocolate","conclusion","contribution","cookie","courage","desk","drawer","establishment","examination","garbage","grocery","honey","impression","improvement","independence","insect","inspection","inspector","king","ladder","menu","penalty","piano","potato","profession","professor","quantity","reaction","requirement","salad","sister","supermarket","tongue","weakness","wedding","affair","ambition","analyst","apple","assignment","assistant","bathroom","bedroom","beer","birthday","celebration","championship","cheek","client","consequence","departure","diamond","dirt","ear","fortune","friendship","funeral","gene","girlfriend","hat","indication","intention","lady","midnight","negotiation","obligation","passenger","pizza","platform","poet","pollution","recognition","reputation","shirt","speaker","stranger","surgery","sympathy","tale","throat","trainer","uncle","youth","time","work","film","water","money","example","while","business","study","game","life","form","air","day","place","number","part","field","fish","back","process","heat","hand","experience","job","book","end","point","type","home","economy","value","body","market","guide","interest","state","radio","course","company","price","size","card","list","mind","trade","line","care","group","risk","word","fat","force","key","light","training","name","school","top","amount","level","order","practice","research","sense","service","piece","web","boss","sport","fun","house","page","term","test","answer","sound","focus","matter","kind","soil","board","oil","picture","access","garden","range","rate","reason","future","site","demand","exercise","image","case","cause","coast","action","age","bad","boat","record","result","section","building","mouse","cash","class","period","plan","store","tax","side","subject","space","rule","stock","weather","chance","figure","man","model","source","beginning","earth","program","chicken","design","feature","head","material","purpose","question","rock","salt","act","birth","car","dog","object","scale","sun","note","profit","rent","speed","style","war","bank","craft","half","inside","outside","standard","bus","exchange","eye","fire","position","pressure","stress","advantage","benefit","box","frame","issue","step","cycle","face","item","metal","paint","review","room","screen","structure","view","account","ball","discipline","medium","share","balance","bit","black","bottom","choice","gift","impact","machine","shape","tool","wind","address","average","career","culture","morning","pot","sign","table","task","condition","contact","credit","egg","hope","ice","network","north","square","attempt","date","effect","link","post","star","voice","capital","challenge","friend","self","shot","brush","couple","exit","front","function","lack","living","plant","plastic","spot","summer","taste","theme","track","wing","brain","button","click","desire","foot","gas","influence","notice","rain","wall","base","damage","distance","feeling","pair","savings","staff","sugar","target","text","animal","author","budget","discount","file","ground","lesson","minute","officer","phase","reference","register","sky","stage","stick","title","trouble","bowl","bridge","campaign","character","club","edge","evidence","fan","letter","lock","maximum","novel","option","pack","park","quarter","skin","sort","weight","baby","background","carry","dish","factor","fruit","glass","joint","master","muscle","red","strength","traffic","trip","vegetable","appeal","chart","gear","ideal","kitchen","land","log","mother","net","party","principle","relative","sale","season","signal","spirit","street","tree","wave","belt","bench","commission","copy","drop","minimum","path","progress","project","sea","south","status","stuff","ticket","tour","angle","blue","breakfast","confidence","daughter","degree","doctor","dot","dream","duty","essay","father","fee","finance","hour","juice","luck","milk","mouth","peace","pipe","stable","storm","substance","team","trick","afternoon","bat","beach","blank","catch","chain","consideration","cream","crew","detail","gold","interview","kid","mark","mission","pain","pleasure","score","screw","sex","shop","shower","suit","tone","window","agent","band","bath","block","bone","calendar","candidate","cap","coat","contest","corner","court","cup","district","door","east","finger","garage","guarantee","hole","hook","implement","layer","lecture","lie","manner","meeting","nose","parking","partner","profile","rice","routine","schedule","swimming","telephone","tip","winter","airline","bag","battle","bed","bill","bother","cake","code","curve","designer","dimension","dress","ease","emergency","evening","extension","farm","fight","gap","grade","holiday","horror","horse","host","husband","loan","mistake","mountain","nail","noise","occasion","package","patient","pause","phrase","proof","race","relief","sand","sentence","shoulder","smoke","stomach","string","tourist","towel","vacation","west","wheel","wine","arm","aside","associate","bet","blow","border","branch","breast","brother","buddy","bunch","chip","coach","cross","document","draft","dust","expert","floor","god","golf","habit","iron","judge","knife","landscape","league","mail","mess","native","opening","parent","pattern","pin","pool","pound","request","salary","shame","shelter","shoe","silver","tackle","tank","trust","assist","bake","bar","bell","bike","blame","boy","brick","chair","closet","clue","collar","comment","conference","devil","diet","fear","fuel","glove","jacket","lunch","monitor","mortgage","nurse","pace","panic","peak","plane","reward","row","sandwich","shock","spite","spray","surprise","till","transition","weekend","welcome","yard","alarm","bend","bicycle","bite","blind","bottle","cable","candle","clerk","cloud","concert","counter","flower","grandfather","harm","knee","lawyer","leather","load","mirror","neck","pension","plate","purple","ruin","ship","skirt","slice","snow","specialist","stroke","switch","trash","tune","zone","anger","award","bid","bitter","boot","bug","camp","candy","carpet","cat","champion","channel","clock","comfort","cow","crack","engineer","entrance","fault","grass","guy","hell","highlight","incident","island","joke","jury","leg","lip","mate","motor","nerve","passage","pen","pride","priest","prize","promise","resident","resort","ring","roof","rope","sail","scheme","script","sock","station","toe","tower","truck","witness","can","will","other","use","make","good","look","help","go","great","being","still","public","read","keep","start","give","human","local","general","specific","long","play","feel","high","put","common","set","change","simple","past","big","possible","particular","major","personal","current","national","cut","natural","physical","show","try","check","second","call","move","pay","let","increase","single","individual","turn","ask","buy","guard","hold","main","offer","potential","professional","international","travel","cook","alternative","special","working","whole","dance","excuse","cold","commercial","low","purchase","deal","primary","worth","fall","necessary","positive","produce","search","present","spend","talk","creative","tell","cost","drive","green","support","glad","remove","return","run","complex","due","effective","middle","regular","reserve","independent","leave","original","reach","rest","serve","watch","beautiful","charge","active","break","negative","safe","stay","visit","visual","affect","cover","report","rise","walk","white","junior","pick","unique","classic","final","lift","mix","private","stop","teach","western","concern","familiar","fly","official","broad","comfortable","gain","rich","save","stand","young","heavy","lead","listen","valuable","worry","handle","leading","meet","release","sell","finish","normal","press","ride","secret","spread","spring","tough","wait","brown","deep","display","flow","hit","objective","shoot","touch","cancel","chemical","cry","dump","extreme","push","conflict","eat","fill","formal","jump","kick","opposite","pass","pitch","remote","total","treat","vast","abuse","beat","burn","deposit","print","raise","sleep","somewhere","advance","consist","dark","double","draw","equal","fix","hire","internal","join","kill","sensitive","tap","win","attack","claim","constant","drag","drink","guess","minor","pull","raw","soft","solid","wear","weird","wonder","annual","count","dead","doubt","feed","forever","impress","repeat","round","sing","slide","strip","wish","combine","command","dig","divide","equivalent","hang","hunt","initial","march","mention","spiritual","survey","tie","adult","brief","crazy","escape","gather","hate","prior","repair","rough","sad","scratch","sick","strike","employ","external","hurt","illegal","laugh","lay","mobile","nasty","ordinary","respond","royal","senior","split","strain","struggle","swim","train","upper","wash","yellow","convert","crash","dependent","fold","funny","grab","hide","miss","permit","quote","recover","resolve","roll","sink","slip","spare","suspect","sweet","swing","twist","upstairs","usual","abroad","brave","calm","concentrate","estimate","grand","male","mine","prompt","quiet","refuse","regret","reveal","rush","shake","shift","shine","steal","suck","surround","bear","brilliant","dare","dear","delay","drunk","female","hurry","inevitable","invite","kiss","neat","pop","punch","quit","reply","representative","resist","rip","rub","silly","smile","spell","stretch","stupid","tear","temporary","tomorrow","wake","wrap","yesterday","Thomas","Tom","Lieuwe"];
		return 'Guest_' + ChatHobby.capFirst(name[ChatHobby.getRandomInt(0, name.length + 1)]);
	},
	
};
serv.listen(HTTP_PORT, function () {
	console.log('Site Started on port 80');
});
server.listen(HTTPS_PORT, function () {
	console.log("Site Started on port 443");
});
