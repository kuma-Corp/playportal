var http = require('http');
var fs = require('fs');
var nodemailer = require('nodemailer');
var mkdir = require('mkdirp');
var mysql = require('mysql');
var express = require('express');
var socketio = require('socket.io')(http);
var app = express();
var connection = mysql.createConnection(
{
  host     : 'playportal.c3nxoczxuh2l.us-west-2.rds.amazonaws.com',
  user     : 'root',
  password : 'kumakuma',
  database : 'playportal',
  port     : 3306
});
var nodemailer = require("nodemailer");
app.get('/', function (req, res) {
	res.send(fs.readFileSync("./index.html","utf-8"));
});
app.use(express.static('public'));
var server = app.listen(3000);
var io = socketio.listen(server);
io.sockets.on('connection', function(socket) {
  socket.emit('greeting');
  socket.on('checkLogin',function(data){
	  console.log(data[0]);
	  console.log(data[1]);
	  connection.query('select * from users where user_name = ? and user_pass = ?', [data[0],data[1]] , function(err,rows){
		  if (err){
        console.log('can not connect');
        console.log(err);
        return;
      }
		  else if(rows[0] !== undefined){
			  socket.emit('successLogin',data[0]);
		  }
	  });
  });
  socket.on("getroom",function(){
	  connection.query('select * from rooms', function(err,rows){
		  if(err){
			  console.log('can not connect');
			  console.log(err);
			  return;
		  }
		  else if(rows[0] !== undefined){
			  for(var i in rows){
				  var user = rows[i].user;
				  var roomname = rows[i].roomname;
				  var others = rows[i].others;
				  console.log(roomname);
				  socket.emit("createRoom",{user,roomname,others});
			  }
		  }
		  else{
			  socket.emit('roomErr');
		  }
	  });
  });
  socket.on("insertRoom",function(data){
	  connection.query('insert into rooms values(0,?,?,?)',[data.user,data.roomname,data.others],function(err){
		  if(err){
			  return;
		  }
		  else{
        var name = data.user;
        mkdir('./public/Users' + data.roomname);
			  socket.emit("complete",name);
		  }
	  });
  });
  socket.on("deleteRoom",function(user){
    connection.query('select * from rooms where user = ?',user,function(err,rows){
      if(err){
        return;
      }else if(rows[0] !== undefined){
        var roomname = [];
			  for(var i in rows){
				  roomname[i] = rows[i].roomname;
			  }
        socket.emit("deleteConf",roomname);
		  }else{
			  socket.emit('roomErr');
		  }
    });
  });
  socket.on("inviteFriend",function(name){
    connection.query('select * from users where user_name = ?',name,function(err,rows){
      if(err){
        console.log(err);
        return;
      }else if(rows[0] !== undefined){
        var id = rows[0].user_id;
        connection.query('select * from Friend where user_id = ?',[id],function(err,rows){
          if(err){
            console.log(err);
            return;
          }else if(rows[0] !== undefined){
            console.log(3);
            var friends = [];
            for(var i in rows){
              friends[i] = rows[i].friend_user;
            }
            socket.emit("invitedFriend",friends);
          }
        });
      }
    });
  });
  socket.on("setDestination",function(data){
		var name = data.name;
		var roomId = data.roomId;
		var lat = data.lat;
		var longi = data.lng;
		connection.query('insert into destination(name,roomId,latitude,longitude) values(?,?,?,?);',[name,roomId,lat,longi]);
		socket.emit("moveTomain",null);
	});
  socket.on("delsub",function(user){
    connection.query('delete from rooms where user = ?',user,function(err){
      if(err){
        return;
      }else{
        socket.emit("delConp");
      }
    });
  });
  socket.on("lineinvite",function(Iname){
    connection.query('select * from rooms where user = ?',Iname,function(err,rows){
      if(err){
        console.log(err);
        return;
      }else if(rows[0] !== undefined){
        var roomname = [];
        for(var i in rows){
          roomname[i] = rows[i].roomname;
        }
        console.log(1);
        socket.emit("lineinvite",roomname);
      }else{
        console.log(2);
        socket.emit("lineinvite");
      }
    });
  });
  socket.on("inviteLogin",function(data){
    console.log(1);
    connection.query('select * from users where user_name = ? and user_pass = ?',[data[0],data[1]],function(err,rows){
      if(rows[0] !== undefined){
        // connection.query("insert into users(room) values(?) where name = ?",data[2],data[0]);
        socket.emit("successLogin");
      }else{
        socket.emit("errLogin");
      }
    });
  });
  socket.on("inviteJoin",function(data){
    // connection.query("insert into users(name,password,room) values(?,?,?)",data[0],data[1],data[2],function(err){
    // if(!err){
        socket.emit("successJoin");
  //  }
  //});
  });
  socket.on("mailsend",function(user){
    var smtpTransport = nodemailer.createTransport("SMTP",{
  			service: "Gmail",
  			auth: {
  					user: "narutakki",
  					pass: "b6e61465"
  			}
  	});
  	// setup e-mail data with unicode symbols
  	var mailOptions = {
  			from: "'鳴滝卓矢'<narutakki@gmail.com>", // sender address
  			to: "as.narutakitakuya@gmail.com", // list of receivers
  			subject: "イーハトーヴォ", // Subject line
  			text: "あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。", // plaintext body
  			html: "<b>あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。</b>" // html body
  	};

  	// send mail with defined transport object
  	smtpTransport.sendMail(mailOptions, function(error, response){
  			if(error){
  					console.log(error);
  			}else{
  					console.log("Message sent: " + response.message);
  			}
  			// if you don't want to use this transport object anymore, uncomment following line
  			smtpTransport.close(); // shut down the connection pool, no more messages
  	});
  });
});
console.log('Server running at http://localhost:3000/');
