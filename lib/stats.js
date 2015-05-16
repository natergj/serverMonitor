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
		var response = {};
		var lines = data.toString().split('\n');


		cb(err, response);
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
		var allDone = true;

		Object.keys(stepsCompleted).forEach(function(s){
			if(stepsCompleted[s] == false){
				allDone = false;
			}
		});
		if(allDone){
			cb(err, stats);
		}
	}

	checkComplete();

	
	getDiskUsage(function(err, data){
		if(err){
			console.log(err);
		}else{
			stats.diskUsage = data;
		}
		stepsCompleted.getDiskUsage = true;
		checkComplete();
	});

	getFreeMemory(function(err, data){
		if(err){
			console.log(err);
		}else{
			var str = data.toString();
			var lines = str.split('\n');
			var headers = {};
			var data = {};
			lines[0].split(/(\s+)/).forEach(function(h,i){
				if(h.trim().length > 0){
					headers[i] = h;
				}
			});
			lines.splice(0,1);
			lines.forEach(function(l){
				var parts = l.split(/(\s+)/);

				var obj = {};
				var key;
				parts.forEach(function(p,i){
					if(p.trim().length > 0){
						if(Object.keys(headers).indexOf(i.toString()) < 0){
							key = p;
						}else{
							obj[headers[i]] = p;
						}
					}
				});
				if(parts.length > 1){
					key=key?key:'memory';
					data[key]=obj;
				}
			});
			stats.memoryUsage = data;
		}
		stepsCompleted.getFreeMemory = true;
		checkComplete();
	});
	
}

if(require.main === module){
	getStats(function(err, data){
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