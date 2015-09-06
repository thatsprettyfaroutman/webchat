var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var crypto = require('crypto');
var sanitizer = require('sanitizer');

var DAY = 86400000;
var MINUTE = 60000;
var TEN_SECONDS = 10000;

var reservedNames = [];
var userNames = [];
var messageHistory = [];
var connections = 0;

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/web/index.html');
});

app.get('/web/:view', function(req, res) {
	res.sendFile(__dirname + '/web/' + req.params.view);
});

app.get('/checkuser/:user', function (req, res) {
	var result = {
		data : {
			name : decodeURI(req.params.user),
			sum : false,
			time : false
		}
	};
	var isUnique = true;

	removeOldReservedNames();

	reservedNames.map(function(name) {
		if (name.name == result.data.name) {
			isUnique = false;
		}
	});

	userNames.map(function(name) {
		if (name.name == result.data.name) {
			isUnique = false;
		}
	});

	if (isUnique) {
		result.data.sum = sha1sum(new Date().getTime + 'derpderpdeprdeprppdep');
		result.data.time = new Date().getTime();
		reservedNames.push(result.data);
	}
	res.send(result);
});

io.on('connection', function(socket){
	uniqueConnections();
	removeOldMessages();

	io.emit('message history', messageHistory);

	socket.on('check connection', function (conn) {
		var actualConn = false;
		var connOk = false;
		reservedNames.map(function(name) {
			if (name.name == conn.name && name.sum == conn.sum) {
				connOk = true;
				actualConn = name;
			}
		});

		if (!connOk) {
			socket.disconnect();
		} else {
			actualConn.id = socket.conn.id;
			userNames.push(actualConn);
			uniqueConnections();
		}

	});

	socket.on('disconnect', function () {
		uniqueConnections();
	});

  socket.on('message', function (message){
		console.log(socket.conn.id);
		var msg = {};
		var user = 'UNKNOWN BASTERD';
		userNames.map(function (name) {
			if (name.id == socket.conn.id) {
				user = name.name;
			}
		});

		msg.message = sanitizer.escape(message);
		msg.time = new Date().getTime();
		msg.user = user;

		if (checkDuplicateMessage(msg)) {
			return false;
		}

		messageHistory.push(msg);
		io.emit('message', msg);

		console.log(msg);
  });

	// socket.on('joined', function (user) {
	// 	messageHistory.push({
	// 		message : user + 'just joined!',
	// 		user : user,
	// 		time : new Date().getTime()
	// 	});
	// 	io.emit('message', {
	// 		message : user + ' just joined!',
	// 		user : user,
	// 		time : new Date().getTime()
	// 	});
	// 	console.log('joined', user);
	// })
});

setInterval(uniqueConnections, MINUTE);

http.listen(3000, function(){
  console.log('listening on *:3000');
});


// methods
// --------------------

function uniqueConnections () {
	var sockets = io.of('/').sockets;

	var socketIds = sockets.map(function (socket) {
		return socket.conn.id;
	});

	userNames = userNames.filter(function (name) {
		if (socketIds.indexOf(name.id) == -1) {
			return false
		}

		return true;
	});

	justNames = userNames.map(function (name) {
		return name.name;
	});

	removeOldReservedNames();

	justReserved = reservedNames.map(function (name) {
		return name.name;
	});

	console.log('users:', justNames.join(', '));
	console.log('reserved usernames: ', justReserved.join(', '));

	console.log('connections', sockets.length);
	io.emit('connections amount', sockets.length || 0);
	io.emit('active users', justNames || []);

}




function removeOldMessages() {
	var currentTime = new Date().getTime();

	if (messageHistory.length < 100) {
		return false;
	}

	messageHistory = messageHistory.filter(function (msg) {
		if (currentTime - msg.time < DAY) {
			return true;
		}

		return false;
	});
}

function removeOldReservedNames() {
	var currentTime = new Date().getTime();

	reservedNames = reservedNames.filter(function (name) {
		if (currentTime - name.time < TEN_SECONDS) {
			return true;
		}

		return false;
	});
}

function sha1sum(input){
  return crypto.createHash('sha1').update(JSON.stringify(input)).digest('hex')
}

function checkDuplicateMessage(msg) {
	var usersMessages = messageHistory.filter( function (item) {
		if (item.user == msg.user) {
			return true;
		}
		return false;
	});

	console.log(usersMessages);

	if (usersMessages.length == 0) {
		return false;
	}

	if (usersMessages.pop().message.trim() == msg.message.trim()) {
		return true;
	}

	return false;
}
