//CMPT 470 Technical evaluation Node.js, groupApollo
//Client side application for game. 
//A kineticjs stage is set and the users character is added to it.
//a message is sent to the server to add new user.
//the maze is drawn and a copy of the points maze is sent from the server and 
//drawn here. The game adds in other users and waits for the start message.
//keypresses change direction of user. Other players positions are updated through message passing
//user collects points. Collision detection is between the user and the maze and the other players.
//robot is dead when he collides with enemy. Enemy collisions between themselves dont'matter.

//use WASD keys to move robot

//Outstanding items of work are:
//#1-find a way of setting up game with one robot and n-1 enemy.
//#2-when robot is caught by enemy, the enemy now becomes the robot.
//#3-graphics for enemy and maze.
//#4-score board for each player.
//#5-general layout and design.
//#6-reset game when all points have been removed, with the current robot
//on the filled board.
//#7-after deciding the roles for players, robot or enemy place the enemy away from
//the robot at start.
//#8-start the game over completely button.
//#9-make tunnels work from left-right side of screen. Players should be able to go in a
//tunnel and come out the other side.


// The URL of your web server (the port is set in app.js)
	var url = '192.168.15.101:8080';

//kineticjs stage
var stage = new Kinetic.Stage({
	container: 'maze',
	width: 1260,
	height: 800
});

//sound for eating dot
var eatSnd = new Audio("/sound/Ting.wav"); // buffers automatically when created


//generate random hex value for colour
var randomHexGenerator = function(){
        return '#'+'0123456789abcdef'.split('').map(function(v,i,a){
            return i>5 ? null : a[Math.floor(Math.random()*16)] }).join('')
    };


//layer for our players
var charlayer = new Kinetic.Layer();
stage.add(charlayer);

//am I the robot or the ghosts?
//need to find a way to assign this initially
var robot=1;
var points=0;
//need way to assign personal name at start for each person
var playerName='Spirou'
//how many players
var players=1;
var gridSize=30;

//speed of players, don't change
var speed=10;
//holds current player direction
var myDirection = 'right';
// Generate an unique ID
var id = Math.round($.now()*Math.random());

var doc = $(document);
var clients = {};
var characters = {};
var socket = io.connect(url);

//maze used for collision detection
var maze=	[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
			 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
			 [1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1],
			 [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
			 [1,1,1,1,1,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,1,0,1,1,1,1,1],
			 [1,0,0,0,0,0,0,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,0,0,0,0,0,0,1],
			 [0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0],
			 [1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
			 [1,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1],
			 [1,1,0,1,1,1,1,0,0,0,0,1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1,0,0,0,0,1,1,1,1,0,1,1],
			 [1,1,0,1,1,1,1,0,1,1,0,1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1,0,1,1,0,1,1,1,1,0,1,1],
			 [1,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0,0,1],
			 [1,0,1,1,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,0,1],
			 [0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,0,0,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0],
			 [1,0,0,0,0,0,0,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,0,0,0,0,0,0,1],
			 [1,1,1,1,1,0,1,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,1,0,1,1,1,1,1],
			 [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
			 [1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,0,0,0,0,0,1,0,0,0,0,0,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1],
			 [1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1],
			 [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
			 [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]];


//clone the point layout,will be sent from server.
var mazeClone;

var robotImg = new Image();
//pointer to this user
var robotObj;

//on image load, set up user, this will have to modified depending upon if
//the user is a robot or enemy. Currently everyone is a robot.
//loads up the animation targets and spritesheet
     robotImg.onload = function() {
        var blob = new Kinetic.Sprite({
          x: gridSize*20,
          y: gridSize*11,
          image: robotImg,
          animation: 'right',
          animations: robotAnim,
          frameRate: 7
        });
        robotObj=blob;
        //start event loop
        charlayer.add(robotObj);
        robotObj.start();
}

  robotImg.src="images/robot.png"

//our bounding box object
//is hidden from view.
//May be possible to remove at a later date.
var myRect = new Kinetic.Rect({
	x: gridSize*20,
	y: gridSize*11,
	width: gridSize,
	height:gridSize,
	fill: 'red',
	stroke:'black',
	opacity:0,
	strokeWidth: 1
});

//draw maze to canvas, because it is much faster than kineticjs.
//done only at start
var bgMaze=function(){
	 var canvas = document.getElementById('drawCanvas');
      var context = canvas.getContext('2d');
for (var i=0;i<21;i++){
	for (var j=0;j<41;j++){
		if (maze[i][j]=='0'){
		
		context.beginPath();
 context.rect((j*gridSize),(i*gridSize), gridSize, gridSize);
      context.fillStyle = 'white';
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = 'black';
      context.stroke();
	}
else{
	context.beginPath();
 context.rect((j*gridSize),(i*gridSize), gridSize, gridSize);
      context.fillStyle = 'green';
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = 'black';
      context.stroke();
}
}
}
}
//create bgMaze
bgMaze();

//add a new player to our game
//sends the server a message to send to each player
var addPlayer=function(){
	socket.emit('addPlayer',{
		'x': myRect.getX(),
				'y': myRect.getY(),
				'id': id,
				'score': points,
				'name': playerName,
				'robot': robot
	});
}
addPlayer();

//on click start game
$('#start').on('click',function(){
	socket.emit('startGame',{});
})

//draw the points, updated on each redraw.
var bgPoints=function(){
 var canvas = document.getElementById('drawCanvas');
      var context = canvas.getContext('2d');
for (var i=0;i<21;i++){
	for (var j=0;j<41;j++){
		if (mazeClone[i][j]=='2'){
		
		context.beginPath();
 context.rect(((j*gridSize)+(gridSize/2)),((i*gridSize)+(gridSize/2)),2,2);
      context.fillStyle = 'red';
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = 'red';
      context.stroke();
	}else if(mazeClone[i][j]=='0'){
		context.beginPath();
 context.rect(((j*gridSize)+(gridSize/2)),((i*gridSize)+(gridSize/2)),2,2);
      context.fillStyle = 'white';
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = 'white';
      context.stroke();
	}
}
}
}

//robot animation script
var robotAnim={
	right:[{
		x: 0,
        y: 0,
        width: 30,
        height: 30
	},
	{
		x: 29,
        y: 0,
        width: 30,
        height: 30
	},
	{
	x: 59,
        y: 0,
        width: 30,
        height: 30	
	},
	{
		x: 89,
        y: 0,
        width: 30,
        height: 30	
	}],
	left:[{
	x: 119,
        y: 0,
        width: 30,
        height: 30	
	},
	{
		x: 149,
        y: 0,
        width: 30,
        height: 30	
	},
	{
		x: 179,
        y: 0,
        width: 30,
        height: 30	
	},
	{
		x: 209,
        y: 0,
        width: 30,
        height: 30
	}],
	down:[{
		x: 239,
        y: 0,
        width: 30,
        height: 30
	},
	{
		x: 269,
        y: 0,
        width: 30,
        height: 30
	},
	{
		x: 299,
        y: 0,
        width: 30,
        height: 30
	},
	{
		x: 329,
        y: 0,
        width: 30,
        height: 30
	}],
	up:[{
		x: 359,
        y: 0,
        width: 30,
        height: 30
	},
	{
x: 389,
        y: 0,
        width: 30,
        height: 30
	},
	{
		x: 419,
        y: 0,
        width: 30,
        height: 30
	},
	{
		x: 449,
        y: 0,
        width: 30,
        height: 30
	}]
};
charlayer.add(myRect);
charlayer.draw();

//on 'plusPlayer' message from server add a new player to the game
socket.on('plusPlayer',function(data){
	if(! (data.id in clients)){
			var otherRect = new Kinetic.Rect({
		x: gridSize,
		y: gridSize,
		width: gridSize,
		height:gridSize,
		fill: randomHexGenerator(),
		stroke:'black',
		strokeWidth: 1
			});
			characters[data.id]=otherRect;
			charlayer.add(otherRect);
		}
		clients[data.id] = data;
		clients[data.id].updated = $.now();
		players+=1;

});

//on  'xymoving' message from server update player positions
socket.on('xymoving', function (data) {

		if(! (data.id in clients)){
			var otherRect = new Kinetic.Rect({
		x: gridSize,
		y: gridSize,
		width: gridSize,
		height:gridSize,
		fill: randomHexGenerator(),
		stroke:'black',
		strokeWidth: 1
			});
			characters[data.id]=otherRect;
			charlayer.add(otherRect);
				players+=1;
		}
		//move kinetic
		var moveChar=characters[data.id];
		moveChar.setX(data.x);
		moveChar.setY(data.y);
// Saving the current client state
		clients[data.id] = data;
		clients[data.id].updated = $.now();
	
	});

//get point from server
socket.on('point',function(data){
	eatSnd.play();
	points+=1;
	mazeClone[data.y][data.x]=0;
});

//make a copy of the maze sent from server
socket.on('sendMaze',function(data){
	mazeClone=data.maze;
});
	//set timeframe for update
	var lastEmit = $.now();

//update points maze
socket.on('removePoint',function(data){
mazeClone[data.y][data.x]=0;
});

//get keypress events
		doc.keypress(function(event) {
  if (event.which == 97 )
{

     myDirection='left';
     robotObj.setAnimation('left');
 }
    else if(event.which == 119)
    {

   	 myDirection='up';
   	 robotObj.setAnimation('up');
}
    else if(event.which == 100)
    {

   	 myDirection='right';
   	 robotObj.setAnimation('right');
}
    else if(event.which == 115)
    {

   	 myDirection='down';
   	 robotObj.setAnimation('down');
 }
});


//collision detection between players.
var checkForCollisions=function(){
	var xGrid=myRect.getX();
	xGrid=Math.floor(xGrid/gridSize);
	var yGrid=myRect.getY();
	yGrid=Math.floor(yGrid/gridSize);
	var charGridX;
	var charGridY;
	if (players>1){
	for (var dataID in clients){
		var item=characters[dataID];
		charGridX=item.getX();
		charGridY=item.getY();
		charGridX=Math.floor(charGridX/gridSize);
		charGridY=Math.floor(charGridY/gridSize);
		if (charGridY===yGrid && charGridX===xGrid && robot==1){
			myRect.setFill('black');
			socket.emit('collision',{
			'id': id,
			'other': dataID			
			});
		}
	}
}

}

//look for collisons with maze
//check maze values in the direction the user is going to see if there
//is an object in the way.
var checkMaze=function(direction){
	var xGrid=myRect.getX();
	xGrid=Math.floor(xGrid/gridSize);
	var yGrid=myRect.getY();
	yGrid=Math.floor(yGrid/gridSize);
	var xMod=myRect.getX()%gridSize;
	var yMod=myRect.getY()%gridSize;
	if (direction=='left'){
		xGrid-=1;
		var mazeValue=maze[yGrid][xGrid];
		if (mazeValue==1 && xMod>=10){
			return 0;
		}else{
		return mazeValue;
	}
	}
	else if (direction=='right'){
		xGrid+=1;
		var mazeValue=maze[yGrid][xGrid];
		if (mazeValue==1 && xMod>=10){
			return 0;
		}else{	
		return mazeValue;
	}
	}
	else if (direction=='up'){
		yGrid-=1;
		var mazeValue=maze[yGrid][xGrid];
		if (mazeValue==1 && yMod>=10){
			return 0
		}else{
		return mazeValue;
	}}

	else if (direction=='down'){
		yGrid+=1;
		var mazeValue=maze[yGrid][xGrid];
		return mazeValue;
	}
}

//check if player can move and update speed and set value on player
var updatePosition=function(){
	var newXY;
	var xMod=myRect.getX()%gridSize;
	var yMod=myRect.getY()%gridSize;
	if (myDirection=='left' && checkMaze('left')=='0' && yMod==0){
			 newXY=myRect.getX()-speed;
			myRect.setX(newXY);
			robotObj.setX(newXY);
			}

		else if(myDirection=='right' && checkMaze('right')=='0' && yMod==0){
			newXY=myRect.getX()+speed;
			myRect.setX(newXY);
			robotObj.setX(newXY);
		}

else if (myDirection=='up' && checkMaze('up')=='0' && xMod==0){
	newXY=myRect.getY()-speed;
			myRect.setY(newXY);
			robotObj.setY(newXY);
		}
		else if (myDirection=='down' && checkMaze('down')=='0' && xMod==0){
			newXY=myRect.getY()+speed;
			myRect.setY(newXY);
			robotObj.setY(newXY);
		}
	};

//doesn't work yet
var printScore=function(){
	var output;
	for (var dataID in clients){
		output+="<p>"+dataID.name+"-"+dataID.score+"</p>";
	}
		$('#score').html(output);
}

//on start message play game
var intFunc;
socket.on('start',function(){
	 intFunc=setInterval(function(){redraw()},50);
});

socket.on('stop',function(data){
//	clearInterval(intFunc);
});

//redraw loop
//called by SetInterval ever 50/1000 sec
var redraw=function(){

	updatePosition();
	//send position information to everyone
		socket.emit('xymove',{
				'x': myRect.getX(),
				'y': myRect.getY(),
				'id': id,
				'score': points,
				'name': playerName,
				'robot': robot
			});
		checkForCollisions();
		bgPoints();
		charlayer.draw();
		printScore();
		//handles people dropping off connection
		//sends message to server to decrement number of players
		for(ident in clients){
			if($.now() - clients[ident].updated > 5000){
				characters[ident].remove();
				delete clients[ident];
				delete characters[ident];
				players-=1;
				//not functional yet
				socket.emit('remove',{
				'id': id,
				'name': playerName
			});
			}
		}

}

		