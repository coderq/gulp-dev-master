var http = require('http');

http.createServer(function(req, res) {
	res.end('success!');
}).listen('4002', function() {
	console.log('Node is started on port 4002.');
});