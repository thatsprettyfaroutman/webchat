(function () {

	var socket = null;
	var user = '';
	var handshakeOrSomething = null;

	$('form.name').submit(function () {
		var $input = $(this).find('input').first();
		tryName($input.val().trim());
		return false;
	});

	$('form.message').submit(function() {
		var $input = $(this).find('input').first();

		if (!socket) {
			return false;
		}

		if ($input.val().trim() == '') {
			return false;
		}

    socket.emit('message', $input.val().trim());
    $input.val('');
    return false;
  });

	function tryName(name) {
		user = name.trim();

		$.ajax({
			url : '/checkuser/' + encodeURI(user),
			dataType : 'json',
			type : 'GET'
		}).then(function (res) {
			if (res && res.data && res.data.sum !== false) {
				handshakeOrSomething = res.data;
				connect();
			} else {
				console.log('username taken');
				$('ul.messages')
					.prepend('<li><span class="message message--alert">Name taken</span></li>');
			}
		});

		return false;
	}

	function connect() {
		socket = io();

		$('form.name').remove();
		$('form.message').removeClass('hidden');

		socket.on('connect', function () {
			checkConnection.call(socket);
			$('form.message').find('input').first().focus();
		});

		socket.on('disconnect', function(){
			$('ul.messages')
				.empty()
				.prepend('<li><span class="message message--alert">DISCONNECTED! Reconnecting in ten seconds</span></li>');
			socket = null;

			setTimeout(function () {
				window.location = '/';
			}, 10000);
			// reconnectLoop();

			// alert('What are you doing? DISCONNECTIING!');
		});

		socket.on('message', function (msg) {
			var $message = $('<li />');
			$message.html(buildMessage(msg));

			if (msg.user == user) {
				$message.addClass('self');
			}

			$('ul.messages').prepend($message);
		});

		// socket.on('connections amount', function(amount) {
		// 	$('.connections').html(amount);
		// });

		socket.on('active users', function (users) {
			$users = $('ul.users');
			$users.empty();
			$.each(users.sort(), function () {
				$users.append('<li>' + this + '</li>');
			});
			$users.prepend('<li class="count">' + users.length + ' active users</li>');
		});

		socket.on('message history', function (msgs) {
			var $messages = $('ul.messages');
			$messages.empty();
			$.each(msgs, function() {

				console.log(this);
				var $message = $('<li/>');
				$message.html(buildMessage(this));

				if (this.user == user) {
					$message.addClass('self');
				}

				$messages.prepend($message);
			})
		});

	}

	function checkConnection() {
		var socket = this;
		socket.emit('check connection', handshakeOrSomething);
	}

	function reconnectLoop() {
		if (!socket) {
			tryName(user);
			setTimeout(reconnectLoop, 5000);
		}
	}

	function buildMessage(msg) {
		var time = new Date(msg.time);
		var hours = time.getHours();
		var minutes = time.getMinutes();
		var message = '';

		if (('' + hours).length == 1) {
			hours = '0'+hours;
		}

		if (('' + minutes).length == 1) {
			minutes = '0'+minutes;
		}

		message += '<time>' + hours + '.' + minutes + '</time>';
		message += '<span class="user">' + msg.user + '</span>';
		message += '<span class="message">' + msg.message + '</span>';

		return message;
	}


	$(function () {
		$('form.name input').first().focus();
	});


}());
