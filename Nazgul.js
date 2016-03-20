var cluster = require('cluster');

if(cluster.isMaster){

  var cpuCount = require('os').cpus().length;

  for(var i=0; i < cpuCount; i++){
    cluster.fork();
  }
  cluster.on('exit', function(worker){
    console.log('Worker died :( '+worker.id);
    cluster.fork();
  })
}else{


var net = require('net');
var http = require('http');
var fs = require('fs');
//var mongoose = require('mongoose');
//var Schema = mongoose.Schema();
//var utf81 = require('utf8');
var HOST = 'api.faclon.com';
var PORT = 9000;
var server = net.createServer();
//var db = mongoose.connect('mongodb://52.77.248.61:27017/mydb');
//var deviceModel = new Schema({
     //   data: [ { type: Schema.Types.Mixed, required: true} ],
    //    time: { type: Date, default:Date.now }
  //      }
//);
var options = {
        host: 'api.faclon.com',
        port:4000,
        path:'/',
        method:'POST',
        headers:{
                'Content-Type':'application/json'
        }
};
//
// String.prototype.escapeSpecialChars = function() {
//     return this.replace(/\\n/g, "\\n")
//                .replace(/\\'/g, "\\'")
//                .replace(/\\"/g, '\\"')
//                .replace(/\\&/g, "\\&")
//                .replace(/\\r/g, "\\r")
//                .replace(/\\t/g, "\\t")
//                .replace(/\\b/g, "\\b")
//                .replace(/\\f/g, "\\f");
// };

server.on('listening', function(){
        console.log('Server listening on '+HOST+':'+PORT);
        });

server.on('connection', function(socket){
        socket.setTimeout(60000, function(){
                try{
                        socket.end();
                      }
             catch(x){
                     console.log('On end '+x);
             }
     });

     socket.on('data', function(data){
             //console.log(utf81.decode(JSON.stringify(hex2a(data))));
     //      console.log(decodeURIComponent(data.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&')));
//              console.log(data);
//              console.log(JSON.stringify(data));
//              console.log(String.fromCharCode(data));
     //      console.log(fromHex(String.fromCharCode(data)));
             //var chunk = data.toString().split(" ")
             var tr=data.toString();
             console.log(tr);
             var news = tr.substr(tr.search('{'));
             //console.log(tr.body);
             var news2 = news.replace(" ","").replace("\n","");
             console.log(news2);
             var jso= JSON.parse(news2);
             //var esc = jso.escapeSpecialChars();
             //console.log(esc);;
             console.log(jso.chunk);
             var req = http.request(options, function(res){
             res.setEncoding('utf8');
             var body = "";
             res.on('data', function(chunk){
                     body+=chunk;
             });
             res.on('end', function(chunk){
                     body+=chunk;
                     console.log(body);
             });
             });
             req.write(JSON.stringify(jso));
             req.end();
             socket.write('Succesful');
     });

     socket.on('end', function(data){
             socket.end();
             console.log('Ended');
           });
  socket.on('close', function(data){
          socket.end();
          socket.destroy();
          console.log('Closed');
  });
  socket.on('timeout', function(){
          console.log('Timed out');
  });

  socket.on('error', function(err){
          console.log(err);
  });
});

server.on('close', function(){
});

server.listen(PORT);
}
