var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var msgs = [];
var connections = 0;

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/web/index.html');
});

app.get('/web/:view', function(req, res) {
	res.sendFile(__dirname + '/web/' + req.params.view);
});

io.on('disconnection', function(socket){
  console.log('a user disconnected');
	connections--;
	if (connections < 0) {
		connections = 0;
	}

	socket.emit('connections amount', connections);

	console.log('connections', connections);
});

io.on('connection', function(socket){
	connections++;
	socket.emit('connections amount', connections);
	console.log('connections', connections);

	io.emit('message history', msgs);

  socket.on('message', function (msg){
		msg.time = new Date().getTime();
		msgs.push(msg);

		io.emit('message', {
			message : msg.user + ' : ' + msg.message,
			user : msg.user,
			time : msg.time
		});

		console.log(msg);
  });

	socket.on('joined', function (user) {
		msgs.push({
			message : user + 'just joined!',
			user : user,
			time : new Date().getTime()
		});
		io.emit('message', {
			message : user + ' just joined!',
			user : user,
			time : new Date().getTime()
		});
		console.log('joined', user);
	})
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
