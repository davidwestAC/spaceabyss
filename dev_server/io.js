const fs = require('fs');

let options;
let protocol;
if (process.env.SSLKEY) {
    options = {
        key: fs.readFileSync(process.env.SSLKEY),
        cert: fs.readFileSync(process.env.SSLCERT)
    };
    protocol = "https";
} else {
    console.log("No SSL certificate selected!")
    options = {}
    protocol = "http";
}

function handler(request, response) {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('hello world');
    response.end();
}


const app = require(protocol).createServer(options, handler).listen(process.env.PORT);
const io = require('socket.io').listen(app);
// For socket.io 3.0 we would need to do the below line instead
//var io = require('socket.io')(app);




module.exports = {
    io
}