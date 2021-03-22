const { exec } = require("child_process");
var http = require('http'),
    fs = require('fs'),
    // NEVER use a Sync function except at start-up!
    index = fs.readFileSync(__dirname + '/index.html');
const express = require('express')

exec('cp exports/active0.mp4 exports/active1.mp4;cp exports/active1.mp4 exports/active0.mp4;');
exec('cd exports; http-server');

var sel = 1, zeroExist = false, oneExists = false;

var app = http.createServer(function(req, res) {
    if (req.url == '/') {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(index);
    }
    if (req.url == '/video0' && fs.existsSync('exports/active0.mp4')) {
      const rs = fs.createReadStream("exports/active0.mp4");
      const { size } = fs.statSync("exports/active0.mp4");
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Length", size);
      rs.pipe(res);
    }
    if (req.url == '/video1' && fs.existsSync('exports/active1.mp4')) {
      const rs = fs.createReadStream("exports/active1.mp4");
      const { size } = fs.statSync("exports/active1.mp4");
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Length", size);
      rs.pipe(res);
    }
});


// Socket.io server listens to our app
var io = require('socket.io')(app);

// Emit welcome message on connection
io.on('connection', function(socket) {
    // Use socket to communicate with this particular client only, sending it it's own id
    socket.emit('welcome', { message: 'Welcome!', id: socket.id });
    io.emit('switch', sel);
    socket.on('i am client', console.log);

});

function checkVideo() {

  if (fs.existsSync('exports/active0.mp4')) zeroExist = true;
  else zeroExist = false;
  if (fs.existsSync('exports/active1.mp4')) oneExists = true;
  else oneExists = false;

  previousSel = sel;

  if (zeroExist && oneExists) {
      if (previousSel == 0) sel = 1;
      if (previousSel == 1) sel = 0;

      exec('rm exports/active'+previousSel+'.mp4');
      io.emit('switch', sel);
      console.log(sel);
  }
}

// Send current time every 10 secs
setInterval(function() {
  checkVideo();
}, 1000);

app.listen(3000);

    // if (req.url == '/video0' && fs.existsSync('exports/active0.mp4')) {
    //   const path = 'exports/active0.mp4'
    //   const stat = fs.statSync(path)
    //   const fileSize = stat.size
    //   const range = req.headers.range

    //   if (range) {
    //     const parts = range.replace(/bytes=/, "").split("-")
    //     const start = parseInt(parts[0], 10)
    //     const end = parts[1]
    //       ? parseInt(parts[1], 10)
    //       : fileSize-1

    //     if(start >= fileSize) {
    //       res.status(416).send('Requested range not satisfiable\n'+start+' >= '+fileSize);
    //       return
    //     }
        
    //     const chunksize = (end-start)+1
    //     const file = fs.createReadStream(path, {start, end})
    //     const head = {
    //       'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    //       'Accept-Ranges': 'bytes',
    //       'Content-Length': chunksize,
    //       'Content-Type': 'video/mp4',
    //     }

    //     res.writeHead(206, head)
    //     file.pipe(res)
    //   } else {
    //     const head = {
    //       'Content-Length': fileSize,
    //       'Content-Type': 'video/mp4',
    //     }
    //     res.writeHead(200, head)
    //     fs.createReadStream(path).pipe(res)
    //   }
    // }