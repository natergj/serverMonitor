var util = require('util');

var levels = [
	'ERROR','WARN','INFO','DEBUG'
];

levels.forEach(function(level, i) {
  exports[level.toLowerCase()] = function() {
  	if(process.env.LOGLEVEL>i){
  		//write log only if logging level is above threshold set in process.env
	    console.error('[%s] %s', level, util.format.apply(util, arguments));
	}else{
		//do nothing.
	}
  };
});