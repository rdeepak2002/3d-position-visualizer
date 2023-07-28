const http = require('http');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config();

let handleRequest = (request, response) => {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });
    let url = request.url;
    if (url === '' || url === '/') {
        url = 'index.html';
    }
    const filePath = path.join(__dirname, 'public', url);
    fs.readFile(filePath, null, function (error, data) {
        if (error) {
            console.error(`Unable to retrieve file ${filePath}`);
            response.writeHead(404);
            response.write('404 page not found');
        } else {
            console.info('Served index.html file');
            response.write(data);
        }
        response.end();
    });
};

http.createServer(handleRequest).listen(process?.env?.PORT || 8081);
