	var url  = require('url'),
    http = require('http');
var port = 80;

http.createServer(function(serverRequest, serverResponse) {
  var requestUrl = url.parse(serverRequest.url);
  var body = [];

  console.log(requestUrl.href);

  serverRequest.on('data', function(data) {
    body.push(data);
  });
  serverRequest.on('end', function() {
    var request = http.request({
      host:    serverRequest.headers.host,
      port:    3000, // 飛ばしたいポート
      path:    requestUrl.path,
      method:  serverRequest.method,
      headers: serverRequest.headers
    },
    function(response) {
      serverResponse.writeHead(response.statusCode, response.headers);
      response.on('data', function(chunk) {
        serverResponse.write(chunk);
      });
      response.on('end', function() {
        serverResponse.end();
      });
    });
    if(body.length > 0) {
      request.write(body.join(''));
    }
    request.end();
  });
}).listen(port);