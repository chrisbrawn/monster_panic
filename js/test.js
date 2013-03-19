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
//#5-general layout and design.
//#7-after deciding the roles for players, robot or enemy place the enemy away from
//the robot at start.
//#9-make tunnels work from left-right side of screen. Players should be able to go in a
//tunnel and come out the other side.


var imagesLoaded={};
var sources = {
	robot:'images/robot.png',
	monster:'images/monster.png'
}

  function loadImages(sources) {
        var loadedImages = 0;
        var numImages = 0;
        // get num of sources
        for(var src in sources) {
          numImages++;
        }
        for(var src in sources) {
          imagesLoaded[src] = new Image();
          imagesLoaded[src].onload = function() {
           
          };
          imagesLoaded[src].src = sources[src];
        }
      }

loadImages(sources);

window.onload = function(){
// The URL of your web server (the port is set in app.js)
//	var url = 'cbrawn.monster_panic.jit.su:80';
	//uncomment below with your local ip to run locally
	var url = '192.168.15.105:8080';

//kineticjs stage
var stage = new Kinetic.Stage({
	container: 'maze',
	width: 1260,
	height: 650
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
var robot=0;
var points=0;
//need way to assign personal name at start for each person
var playerName='monster';
//how many players
var players=1;
var gridSize=30;

//speed of players, don't change
var speed=10;
//holds current player direction
var myDirection = '';
var previousDirection ='';
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
var monsterImg = new Image();

  robotImg.src="images/robot.png"
  monsterImg.src="images/monster.png"

//pointer to this user
var robotObj;

//on image load, set up user, this will have to modified depending upon if
//the user is a robot or enemy. Currently everyone is a robot.
//loads up the animation targets and spritesheet
   robotImg.onload = function() {
     	if (robot==1){
        var blob = new Kinetic.Sprite({
        name:'robot',
          x: gridSize*20,
          y: gridSize*11,
          image: imagesLoaded.robot,
          animation: 'right',
          animations: robotAnim,
          frameRate: 7
        });
        robotObj=blob;
        //start event loop
        charlayer.add(robotObj);
        robotObj.start();
        playerName='robot';
    }else{
    	var blob = new Kinetic.Sprite({
    	name:'monster',
          x: gridSize*20,
          y: gridSize*11,
          image: monsterImg,
          animation: 'right',
          animations: robotAnim,
          frameRate: 7
        });
        robotObj=blob;
        //start event loop
        charlayer.add(robotObj);
        robotObj.start();
        playerName='monster';
    }
}




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
 context.rect((j*gridSize)+.5,(i*gridSize)+.5, gridSize, gridSize);
      context.fillStyle = 'white';
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = 'gainsboro';
      context.stroke();
	}
else{
	context.beginPath();
 context.rect((j*gridSize)+.5,(i*gridSize)+.5, gridSize, gridSize);
      context.fillStyle = 'silver';
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = 'grey';
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


//tries to reset players to new robot, this user who pushed the button
//and gives out monster id's to everyone else.
//doesn't work perfectly yet.
$("#reset").on("click",function(){
	socket.emit('resetGame',{});
});


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


//get robot value 1=robot, 0=monster
socket.on('robot',function(data){
	robot=data.robot;
	if (data.robot=='1'){
		playerName='robot';
	}else{
		playerName='monster';
	}
	//if(data.move=='yes' && robot=='0'){
	//	myRect.setX(30);
	//	myRect.setY(30);
	//	robotObj.setX(30);
	//	robotObj.setY(30);
	//}
	checkType();
});

//on  'xymoving' message from server update player positions
socket.on('xymoving', function (data) {

		if(! (data.id in clients)){
		if (data.robot==1 && data.name=='robot'){
		var blob = new Kinetic.Sprite({
			name:'robot',
          x: data.x,
          y: data.y,
          image: imagesLoaded.robot,
          animation: 'right',
          animations: robotAnim,
          frameRate: 7
        });
	}else{
		var blob = new Kinetic.Sprite({
			name:'monster',
          x: data.x,
          y: data.y,
          image: imagesLoaded.monster,
          animation: 'right',
          animations: robotAnim,
          frameRate: 7
        });
	}

        //start event loop
        charlayer.add(blob);
        blob.start();
			characters[data.id]=blob;
				players+=1;
		}
		//move kinetic
		var moveChar=characters[data.id];
//		checktype(moveChar);
if  (data.name=='monster' && moveChar.getName()=='robot'){
		var blob = new Kinetic.Sprite({
    	name:'monster',
          x: moveChar.getX(),
          y: moveChar.getY(),
          image: monsterImg,
          animation: data.currentDirection,
          animations: robotAnim,
          frameRate: 7
        });
        moveChar.remove(); 
        moveChar=blob;
        characters[data.id]=moveChar;
        charlayer.add(moveChar);
        moveChar.start();
	}else if 
	(data.name=='robot' && moveChar.getName()=='monster'){
		var blob = new Kinetic.Sprite({
    	name:'robot',
          x: moveChar.getX(),
          y: moveChar.getY(),
          image: robotImg,
          animation: data.currentDirection,
          animations: robotAnim,
          frameRate: 7
        }); 
         moveChar.remove(); 
        moveChar=blob;
        characters[data.id]=moveChar;
        charlayer.add(moveChar);
        moveChar.start(); 
	}


		moveChar.setX(data.x);
		moveChar.setY(data.y);
// Saving the current client state
		clients[data.id] = data;
		clients[data.id].updated = $.now();
	
	});

//get point from server
socket.on('point',function(data){
	eatSnd.play();
	points+=data.players*1;
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
	previousDirection=myDirection;
     myDirection='left';
     robotObj.setAnimation('left');
 }
    else if(event.which == 119)
    {
	previousDirection=myDirection;
   	 myDirection='up';
   	 robotObj.setAnimation('up');
}
    else if(event.which == 100)
    {
    previousDirection=myDirection;
   	 myDirection='right';
   	 robotObj.setAnimation('right');
}
    else if(event.which == 115)
    {
    previousDirection=myDirection;
   	 myDirection='down';
   	 robotObj.setAnimation('down');
 }
});


//collision detection between players.
//if a player robot has collided with a monster, send a
//collision message to server.
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
			'other': dataID,	
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

//prints all scores
//needs formatting etc.
var printScore=function(){
	var output;
	output="My name:"+playerName+" score:"+points+"\n";
for (var dataID in clients){
		var item=clients[dataID];
		output+="name:"+item.name+" score:"+item.score+"\n";
	}
		$('#score').text(output);
}

//on start message play game


var	 intFunc=setInterval(function(){redraw()},50);

socket.on('makeRobot',function(data){
	if(id==data.other){
		robot=1;
		playerName='robot';
		checkType();
	}
});


//make sure that robot displayed is correct,
//if robot=1 then robot
//if robot=0 the monster
var checkType=function(){
	if  (robot=='0' && robotObj.getName()=='robot'){
		var blob = new Kinetic.Sprite({
    	name:'monster',
          x: robotObj.getX(),
          y: robotObj.getY(),
          image: monsterImg,
          animation: 'right',
          animations: robotAnim,
          frameRate: 7
        }); 
        robotObj.remove();
        robotObj=blob;
        charlayer.add(robotObj);

        robotObj.start();
	}else if 
	(robot=='1' && robotObj.getName()=='monster'){
		var blob = new Kinetic.Sprite({
    	name:'robot',
          x: robotObj.getX(),
          y: robotObj.getY(),
          image: robotImg,
          animation: 'right',
          animations: robotAnim,
          frameRate: 7
        }); 
        robotObj.remove();
        robotObj=blob;
        charlayer.add(robotObj);

        robotObj.start();
	}
}
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
				'currentDirection':myDirection,
				'previousDirection':previousDirection,
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
}
		