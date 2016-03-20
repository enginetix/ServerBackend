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
}
else{

var express = require('express'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    http = require('http'),
    //fs = require('fs'),
    //textBody = require('body'),
    Schema = mongoose.Schema;

var db = mongoose.connect('mongodb://localhost:27017/deviceData');
var deviceModel = new Schema({
        data: [{
        key: { type: String},
        value: { type: Schema.Types.Mixed},
        timeOffset: {type: Number},
        time: { type: Date, default:Date.now}
      }]
       // time: { type: Date, default:Date.now }
});
var notifModel = new Schema({
    //notifValue : [ {upperValue : {type: Number}, lowerValue : {type: Number}}],
    deviceID : { type: String , unique: true},
    // usersID : [{ emailID : {type: String, unique:true},
    //   userID : {type: Schema.ObjectId},
    //   regToken : {type: String, unique: true}
    // }]
});

var notifyStore = mongoose.model('notifyStore',notifModel);
var app= express();
app.use(bodyParser());
//app.use(bodyParser.json(
//app.use(function(req, res, next){
//      res.setHeader('Access-Control-Allow-Origin','http://localhost:3000');
//      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//      res.setHeader('Access-Control-Allow-Headers','X-Requested-With,Content-type,Origin');
//      res.setHeader('Access-Control-Allow-Credentials', true);
//      next();
//});
//});
//app.use(cors());
var post_options = {
     host: 'localhost',
     port: '8086',
     path: '/write?db=deviceDB',
     method: 'POST'
 };
var enableCORS = function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        //console.log("enablecors");
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        //console.log("enablingcors");
 // res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    //res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        //console.log(JSON.stringify(req),null,4);
    // intercept OPTIONS method
    //if ('OPTIONS' == req.method) {
     // res.send(200);
    //}
   // else {
      next();
//    }
};
app.use(enableCORS);
var dataSend='';
var device;
var numData=0;
var influxLog = function(req, res, next){

  device= req.body.device;
  //console.log(device);
  //console.log(req.body.chunk);
  var arr=req.body.chunk.data;

  for(var i=0; i<arr.length; i++){
  //console.log(dataSend);
  //console.log(arr[i].tag);
  numData++;
  dataSend = dataSend + device+'.'+arr[i].key+' value='+arr[i].value;
  //client.timing(arr[i].tag+'.'+'macos', arr[i].time,1,'os=macos');
  //if(numData>10){
    var post_req = http.request(post_options, function(res) {
      //res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('Response: '+chunk);
      });
    });
    post_req.write(dataSend);
    post_req.end(function(){

    });
    dataSend='';
  //}
}

next();

};

var notify = function(req, res, next){
      device = req.body.device;
      console.log('Inside Notify');
      console.log(device);
      // notifyStore.findOne(function(err, result){
      //   if(err){
      //     console.log(err);
      //   }else{
      //     console.log(result);
      //   }
      // });

      notifyStore.findOne({deviceID: device.toLowerCase()}, function(err, resul){
        if(err){
          return err;
        }else if(resul){
        console.log(resul);
        var result1 = JSON.stringify(resul);
        var result = JSON.parse(result1);
        var dataArr = req.body.chunk.data;
        //console.log(dataArr);
        var sensor;
        var sensorData;
        for(var i=0; i<dataArr.length; i++){
          sensor = dataArr[i].key;
          sensorData = result[sensor];
          console.log(sensorData);
          if(!(sensorData.lowerValue<dataArr[i].value&&dataArr[i].value<sensorData.upperValue)){
            console.log('Limit Exceeded, Beware!!! for '+device+' sensor : '+sensor);
          }
        }
      }

      });
      //console.log(notifDa.deviceID);
      //var valueNot = notifDa.select('notifValue');
      //notifDa.exec();

      next();

};


app.post('/', influxLog, notify, function(req, res){

    //console.log("we are in mongo now")
        //textBody(req, res, function(err, body){
var deviceData = mongoose.model(req.body.device, deviceModel);
      var devicedataat = new deviceData(req.body.chunk);
   // console.log(body);
//});
     devicedataat.save(function (err) {
        if (err)
                console.log("Error: "+err);
         });
 // res.setHeader("Access-Control-Allow-Origin", "*");
 // res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
 // res.header('Access-Control-Allow-Headers', 'Origin, Content-Type');
  //res.header("Access-Control-Allow-Origin", "*");
  //res.header("Access-Control-Allow-Headers", "X-Requested-With");
         res.status(200);
        res.end("Successful");

});

app.get('/', function(req, res){
  var deviceData = mongoose.model(req.query.device, deviceModel);
  //console.log("Hulalla");
      deviceData.find(function(err, deviceDatas){
          if(err){
            console.log(err);
          }
          else {
            console.log(deviceDatas);
            res.json(deviceDatas);
          }
      });
});

//var port = process.env.PORT || 4000;
app.listen(4000);
}
