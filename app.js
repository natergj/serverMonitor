// Load system variables 
require('./env.js');

// Require Node Modules
var	cluster		= require('cluster'),
	express 	= require('express'),
	fs 			= require('fs'),
	http		= require('http'),
	path		= require('path'),
	socket		= require('socket.io');

// Require App files
var logger 		= require( path.join( __dirname, 'lib', 'logger.js' ) ),
	routes		= require( path.join( __dirname, 'lib', 'routes.js' ) );

logger.info('Starting App');

var app = express(),
	server = http.createServer( app ),
	port = parseInt( process.env.SERVER_PORT, 10 ) || process.env.SERVER_PORT,
	environment = process.env.ENVIRONMENT ? 'development' : 'production';

var routes = require( path.join( __dirname, 'lib', 'routes.js' ) )( app ),
	stats = require( path.join( __dirname, 'lib', 'stats.js'));

server.listen( process.env.SERVER_PORT , function(){
	logger.info( 'In %s mode. Listening on port %d.', process.env.ENVIRONMENT, process.env.SERVER_PORT );
	var socket = require('socket.io-client')('http://'+process.env.SOCKET_SERVER_HOST+':' + process.env.SOCKET_SERVER_PORT);
	socket.on('connect_error', function(err){
		console.log(err);
	});
	socket.on('reconnect', function(num){
		console.log(num);
	});

	function emitStatus(){
		stats.getStats(function(err, data){
			socket.emit('message', data);
			setTimeout(emitStatus,process.env.STATS_REFRESH_TIMEOUT);
		});
	}

	emitStatus();

});
