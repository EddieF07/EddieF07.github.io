// global variables to store application state

// data structure to store points drawn or erased till now.
// points drawn will be rendered in black color
// points erased will be rendered as rgb(200,200,200) same as background
// general structure is
/* 
    points = [
        { erasing: true, points: [[0,0], [0,1], 1,1]},
        { erasing: false, points: [[0,0], [0,1], 1,1]},
    ]
    erasing will be false for points drawn,
    and erasing will be true for points erased
*/

var points = []

// points to store current mouse stoke. when 
// mouse stroke is complete these points will be moved to points array.
var temp_points = []

// current erasing state
var erasing = false;
// current dragging state, 
// dragging is true when mouse is clicked and moved together
var dragging = false;

// init application function, called by p5js
function setup() {
    createCanvas(500, 500);
}

// draw loop function called by p5js in every frame
function draw() {
    // clear the canvas
    background(200)
    // setup stroke size
    strokeWeight(10);

    // render already drawn or erased points
    for (let pinfo of points) {
        if (pinfo.erasing) { // if points were added while erase mode
            stroke(200) // set fill color and stroke color same as background
            fill(200)
            for (let p of pinfo.points) { // render each point with fill and stroke color set above.
                point(p[0], p[1])
            }
        }
        else { // if points were added while draw mode
            stroke(0) // set fill and stroke color to black
            fill(0)
            for (let p of pinfo.points) { // render each point with black color set above
                point(p[0], p[1])
            }
        }
    }

    // now render the points in temp_points array with color based on their erasing status.
    if (erasing) {
        stroke(200)
        fill(200)
        for (let p of temp_points) {
            point(p[0], p[1])
        }
    }
    else {
        stroke(0)
        fill(0)
        for (let p of temp_points) {
            point(p[0], p[1])
        }
    }
}
// function is called by p5js, while mouse is dragged.
function mouseDragged() {
    // set dragging to true
    dragging = true;
    // add current point to temp_points array.
    temp_points.push([mouseX, mouseY]);
}

// called by p5js when mouse is released 
function mouseReleased() {
    // set dragging to false, since the  mouse is released
    dragging = false;
    // create object with temp_points and current erasing status
    let obj = { points: [...temp_points], erasing }
    // send this object to mesibo, and mesibo will send this object to other clients.
    sendObjectToGroup(obj);
    // also add this object to global points array, so that draw function can render them.
    points.push(obj)
    // also set temp_points to empty array, since all the points are processed.
    temp_points = []

}

//Create mesibo users and obtain credentials at mesibo.com/console
var demo_users = [
    {
        'token': 'd14642f3b140e98d975988a06b7187549a79887f5912bebb45b1b6ga026f83aa65'
        , 'uid': 5376428
    },

    {
        'token': 'c5da9863ceb83051bc7235113bd1fbaf464c9e02a65b223c8e8845b1b8jaf3160cbdfd'
        , 'uid': 5376429
    },
    
    {
        'token': 'e4e880d19bdfd64ef01996bb05c1b3d356f9aa9996f655c4fffbe7745b1b9ua8544abd8d7'
        , 'uid': 5376430
    },
    
    {
        'token': '4af6af43aa4af53cab3cec188ffbc7cb065e09955b43c752eceee45b1bbxa6006d58cf0'
        , 'uid': 5376431
    },
]

var uIndex = prompt('Select user: 0, 1, 2, 3', 0);
var selected_user = demo_users[uIndex];

//Initialize mesibo
const MESIBO_APP_ID = 'drawing_app_01.in.webidevi';
const MESIBO_ACCESS_TOKEN = selected_user.token;
const MESIBO_USER_UID = selected_user.uid;
const MESIBO_GROUP_ID = 2627251; //Create a group and add members(demo_users)
const TYPE_CANVAS_MESSAGE = 7;

function MesiboListener() {
}

MesiboListener.prototype.Mesibo_OnConnectionStatus = function (status, value) {
    console.log("TestNotify.prototype.Mesibo_OnConnectionStatus: " + status, ", Value: " + value);
}

MesiboListener.prototype.Mesibo_OnMessageStatus = function (m) {
    console.log("TestNotify.prototype.Mesibo_OnMessageStatus: from "
        + m.peer + " status: " + m.status);
}

// initialising mesibo
var api = new Mesibo();
api.setAppName(MESIBO_APP_ID);
api.setListener(new MesiboListener());
api.setCredentials(MESIBO_ACCESS_TOKEN);
api.start();
// done mesibo initialization


// funcrtion to send message to mesibo
function sendObjectToGroup(pObject) {
    // setup boilerplate for mesibo requirments
    var m = {};
    m.id = api.random();
    m.groupid = MESIBO_GROUP_ID;
    m.flag = MESIBO_FLAG_DEFAULT;
    m.type = TYPE_CANVAS_MESSAGE;

    // here add our message to m obect after converting it to string, 
    m.message = JSON.stringify(pObject);

    // now send the message to mesibo.
    api.sendMessage(m, m.id, m.message);
}

// function to add points received from mesibo to current points state variable
// these points originally drawn or erased by some other user on the network.
function updateP5State(obj) {
    points.push(obj)
}

// handler for mesibo
// this function will called when mesibo recieved some data from server.
MesiboListener.prototype.Mesibo_OnMessage = function (m) {
    if (m && m.type === TYPE_CANVAS_MESSAGE && m.groupid && m.message) {
        // convert message string to javascript object
        var syncObj = JSON.parse(m.message);
        // then update p5js state by calling our updateP5State method
        updateP5State(syncObj);
        return;
    }
}
