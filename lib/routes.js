
function routes( app ) {

	app.get('/', rootRoute );

}


function rootRoute(req, res){

	res.end('Hello Monitor');
	
}

module.exports = routes;