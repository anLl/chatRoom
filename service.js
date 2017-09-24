const http = require('http');
const fs = require('fs');
const pathLib = require('path');
const mime = require('mime');//根据文件扩展名得出MIME类型

const chatServer = require('./lib/chat_server');

//设置缓存
let cache = {};


const server = http.createServer((req,res)=>{
    let filePath = false;
    if(req.url == '/'){
        filePath = 'public/index.html'
    }else{
        filePath = 'public' + req.url;
    }

    let absPath = './'+filePath;

    serveStatic(res,cache,absPath);
});

server.listen(8080,()=>{
    console.log('服务器已经启动,http://localhost:8080')
})
chatServer.listen(server);

//404
function send404(res){
    res.writeHead(404,{'Content-Type':'text/plain'});
    res.write('Error 404: resource not found');
    res.end();
}

//提供文件数据服务

function sendFile(res,filePath,fileContents){
    res.writeHead(200,{'Content-Type':mime.getType(pathLib.basename(filePath))});
    res.end(fileContents);
}
//设置文件缓存,只有第一次从文件系统读取

function serveStatic(res,cache,absPath){
    if(cache[absPath]){
        sendFile(res,absPath,cache[absPath])
    }else{
        fs.exists(absPath,function(exists){
            if(exists){
                fs.readFile(absPath,(err,data)=>{
                    if(err){
                        send404(res)
                    }else{
                        cache[absPath] = data;
                        sendFile(res,absPath,data);
                    }
                })
            }else{
                send404(res);
            }
        })
    }
}
