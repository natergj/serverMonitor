function hanlder( io ){


	io.on('connection', function (socket) {

		socket.on('data', function () {
			console.log('data')
		});

		socket.on('disconnect', function () {

		});

		socket.broadcast.emit('server connected');
	});


}

module.exports = hanlder;