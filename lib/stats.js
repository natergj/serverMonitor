var os = require("os");
var spawn = require('child_process').spawn;

function getDiskUsage(cb){
	var err;
	var data;
	
	var df    = spawn('df', ['-h']),
	grep  = spawn('grep', ['/dev/']);

	df.on('error', function(e){
		if(!err){
			err=[];
		}
		err.push({ 'spawn' : 'Could not spawn task' });
		cb(err, data);
	});

	df.stdout.on('data', function (data) {
		grep.stdin.write(data);
	});

	df.stderr.on('data', function (data) {
		if(!err){
			err=[];
		}
		err.push({ 'df_stderr' : data });
	});

	df.on('close', function (code) {
		if (code !== 0) {
			console.log('df process exited with code ' + code);
		}
		grep.stdin.end();
	});

	grep.on('error', function(e){
		if(!err){
			err=[];
		}
		err.push({ 'spawn' : 'Could not spawn task' });
	});

	grep.stdout.on('data', function (data) {
		response = data;
		parseDiskData(err, data, cb)
	});

	grep.stderr.on('data', function (data) {
		if(!err){
			err=[];
		}
		err.push({'grep_stderr' : data});
	});

	grep.on('close', function (code) {
		if (code !== 0) {
			if(!err){
				err=[];
			}
			err.push({'grep_exit_cd' : code});
		}
	});
}

function parseDiskData(err, data, cb){
	var response;

	if(!data){
		if(!err){
			err=[];
		}
		err.push({'error':'No Disk Data'});
	}else{
		response = [];
		var disks = data.toString().split('\n');
		disks.forEach(function(d){
			var prts = d.split(/(\s+)/);
			if(prts.length > 1){
				var mntPnt = prts[16];
				var freeSpace = prts[6];
				var freePct = 100-parseInt(prts[8]);

				var thisDisk = {
					mountPoint:mntPnt,
					freeSpace:freeSpace,
					percentageFree:freePct
				}

				response.push(thisDisk);
			}
		});
	}
	cb(err,response);
}

function getFreeMemory(cb){
	var err;
	var data;

	var fm    = spawn('free', ['-h']);

	fm.on('error', function(e){
		if(!err){
			err=[];
		}
		err.push({ 'spawn' : 'Could not spawn task' });
		cb(err, data);
	});

	fm.stdout.on('data', function (data) {
		cb(err, data);
	});

	fm.stderr.on('data', function (data) {
		if(!err){
			err=[];
		}
		err.push({ 'fm_stderr' : data });
	});

	fm.on('close', function (code) {
		if (code !== 0) {
			if(!err){
				err=[];
			}
			err.push({'fm_exit_code' : code});
		}
	});
}

function getStats(cb){
	console.log('getting stats');
	var err;
	var stats = {};

	var stepsCompleted = {
		getDiskUsage : false,
		getFreeMemory : false
	}

	Object.keys(os).forEach(function(k){
		if(k!='EOL' && os[k] instanceof Function ){
			stats[k]=os[k]();
		}
	});


	function checkComplete(){
		console.log('checking complete');
		var allDone = true;

		Object.keys(stepsCompleted).forEach(function(s){
			if(stepsCompleted[s] == false){
				allDone = false;
			}
		});
		console.log(allDone);
		if(allDone){
			cb(err, stats);
		}
	}

	checkComplete();

	
	getDiskUsage(function(err, data){
		console.log('starting disk usage');
		if(err){
			console.log(err);
		}else{
			stats.diskUsage = data;
		}
		stepsCompleted.getDiskUsage = true;
		checkComplete();
	});

	getFreeMemory(function(err, data){
		console.log('starting memory usage');
		if(err){
			console.log(err);
		}else{
			stats.memoryUsage = data;
		}
		stepsCompleted.getFreeMemory = true;
		checkComplete();
	});
	
}

if(require.main === module){
	getStats(function(err, data){
		console.log('get stats complete');
		if(err){
			console.log(err);
		}else{
			console.log(JSON.stringify(data,null,'\t'));
		}
	});
}else{
    // Required as module
	module.exports.getStats = getStats;
}