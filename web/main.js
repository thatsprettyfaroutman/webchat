(function () {

	var socket = null;
	var user = '';

	$('form.name').submit(function () {
		var $input = $(this).find('input').first();
		user = $input.val();

		if (user.trim() !== '') {
			$(this).addClass('hidden');
			$('form.message')
				.removeClass('hidden');
			connect();
		}

		return false;

		console.log(user);
	});

	$('form.message').submit(function() {
		var $input = $(this).find('input').first();

		if (!socket) {
			return false;
		}

		if ($input.val().trim() == '') {
			return false;
		}

    socket.emit('message', {
			user : user,
			message : $input.val()
		});
    $input.val('');
    return false;
  });


	function connect() {
		socket = io();

		socket.on('connect', function () {
			console.log('user connected');
			socket.emit('joined', user);
			$('form.message').find('input').first().focus();
		});

		socket.on('disconnect', function(){
			console.log('user disconnected');
			alert('disconnecteeed');
		});

		socket.on('message', function (msg) {
			var $message = $('<li />');
			$message.html(msg.message);

			if (msg.user == user) {
				$message.addClass('self');
			}

			$('ul.messages').prepend($message);
		});

		socket.on('connections amount', function(amount) {
			$('.connections').html(amount);
		});

		socket.on('message history', function (msgs) {
			var $messages = $('ul.messages');
			$messages.empty();
			$.each(msgs, function() {
				var $message = $('<li/>');
				$message.html(this.user + ' : ' + this.message);

				if (this.user == user) {
					$message.addClass('self');
				}

				$messages.prepend($message);
			})
		});

	}


}());
