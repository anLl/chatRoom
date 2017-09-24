const socketio = require('socket.io');

let io,
    guestNumber = 1,
    nickNames = {},
    namesUsed = [],
    currentRoom = {};

exports.listen = function(server){

    //启动socket.io服务器,允许它搭载在已有的http服务上
    io = socketio.listen(server);
    io.set('log level',1);
    //定义每个用户连接的处理逻辑
    io.sockets.on('connection',(socket)=>{
        //在用户连接上来时赋予其一个访客名;
        guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);
        //在用户连接上时把他放入聊天室Lobby
        joinRoom(socket,'Lobby');
        //处理用户的消息,更名,以及聊天室的创建和变更
        handleMessageBroadcasting(socket,nickNames);
        handleNameChangeAttempts(socket,nickNames,namesUsed);
        handleRoomJoining(socket);
        //用户发出请求时,向其提供已经被占用的聊天室的列表
        socket.on('rooms',function(){
            socket.emit('rooms',io.sockets.manager.rooms);
        });

        //处理用户断开连接后的清除逻辑
        handleClientDisconnection(socket,nickNames,namesUsed);
    })
} 

function assignGuestName(socket,guestNumber,nickNames,namesUsed){
    let name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;

    socket.emit('nameResult',{
        success:true,
        name:name
    });

    namesUsed.push(name);

    return guestNumber+1;
}

function joinRoom(socket,room){
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult',{room:room});
    socket.broadcast.to(room).emit('message',{
        text: nickNames[socket.id] + 'has joined' + room + '.'
    });

    let usersInRoom = io.sockets.clients(room);

    if(usersInRoom.length > 1){
        let userInRoomSummary = 'Users currently in' + room + '.';
        for(let index in usersInRoom){
            let userSocketId = usersInRoom[index].id;
            if(userSocketId != socket.id){
                if(index > 0 ){
                    userInRoomSummary +=', '
                }
                userInRoomSummary += nickNames[userSocketId]
            }
        }
        userInRoomSummary += '.';
        socket.emit('message',{text: userInRoomSummary});
    }
}