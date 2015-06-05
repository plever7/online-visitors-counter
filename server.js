var express = require('express'),
path = require('path'),
http = require('http'),
io = require('socket.io'),
r =require('rethinkdbdash')();



var app = express();

app.configure(function() {
    app.set('port', process.env.PORT || 3001);
    app.use(express.logger('dev'));
    app.use(express.bodyParser())
    app.use(express.static(path.join(__dirname, 'public')));
});

var server = http.createServer(app);
io = io.listen(server);

server.listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
});

var count = 0;
var say = 0;

    io.sockets.on('connection', function(socket) {

        count++;
        socket.on('message', function(message) {
            url = message;   
            console.log("Socket connected:" + socket.id);
            
                r.db('test').table('online').insert({
                    socket_id: socket.id,
                    page_id: message
                }).run()
            
            .then(function() {
                 r.db('test').table("online").filter({
                    page_id: message
                }).count().run()
            
            .then(function (res) {
                say = res;
                console.log("connect say" + say);
                io.sockets.emit('pageview', {
                    'say': say,
                    'count': count,
                    'page_id': message
                });
            });
        });
    });
        socket.on('disconnect', function() {
            var page_id = 0;
            console.log("Socket disconnected:" + socket.id);
            
                     r.db('test').table("online").filter({
                        socket_id: socket.id
                    })("page_id").run()
                
                .then(function (item) {
                  
                        page_id = item;
                        console.log("disconnected id:"+  page_id);
                            
                               r.db('test').table("online").filter({
                                    socket_id: socket.id
                                }).delete().run()
                            
                            .then(function () {
                                 r.db('test').table("online").filter({
                                    page_id: String(page_id)
                                }).count().run()
                           
                            .then(function (res) {
                                say = res;
                                count--;
                                console.log("disconnect say" + say);
                                io.sockets.emit('pageview', {
                                    'say': say,
                                    'count': count,
                                    'page_id': page_id
                                });
                            });
                    });
               
        });
    });
});