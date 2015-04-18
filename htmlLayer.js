//
//====== SETUP ======
//

//https://developer.mozilla.org/en-US/docs/Web/Events
/*click
contextmenu // right button before context menu is shown
dblclick?
fullscreenchange
fullscreenerror
gamepadconnected
gamepaddisconnected
keydown, keypress, keyup
mousedown, mousemove, mouseleave, mouseenter, mouseup, mouseout, mouseover*/

var startScale = 2;
var canvas = document.createElement("canvas");
var canvasContext = canvas.getContext("2d");
var baseWidth = 480;
var baseHeight = 300;
canvas.width = baseWidth * startScale;
canvas.height = baseHeight * startScale;
canvas.style.display = "block";
canvas.style.margin = "0px auto";
//http://www.dbp-consulting.com/tutorials/canvas/CanvasKeyEvents.html
canvas.setAttribute("tabindex", 0);
document.body.appendChild(canvas);
// Blog talking about how to scale the canvas on the various browsers.
// http://phoboslab.org/log/2012/09/drawing-pixels-is-hard
canvasContext.imageSmoothingEnabled = false;
canvasContext.webkitImageSmoothingEnabled = false;
canvasContext.mozImageSmoothingEnabled = false;

//====== INPUT ======
canvas.addEventListener("mousedown", doMouseDown, true);
function doMouseDown(event)
{
    //canvas_x = event.pageX;
}

var keysDown = {};
canvas.addEventListener("keydown", doKeyDown, true);
function doKeyDown(e)
{
	keysDown[e.keyCode] = true;
}
canvas.addEventListener("keyup", doKeyUp, true);
function doKeyUp(e)
{
	keysDown[e.keyCode] = false;
}

function ascii(character)
{
    var result = character.charCodeAt(0);
    return result;
}

//
//====== UPDATE ======
//

function viewPanel(position, mode)
{
    this.start = position;
    this.current = position;
    this.mode = mode;
    this.table = null;
}

function tableColumn(mode, panel, name, width)
{
    if(mode == "update")
    {
    }
    else
    {
    }
}

function tableRowItem(mode, panel, value)
{
    if(mode == "update")
    {
    }
    else
    {
    }
}

function updateAndDraw(mode, secondsElapsed) 
{
    if(mode == "draw")
    {
        // Fill to black.
        canvasContext.fillStyle = "#000000";
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    }
        
    var panel = new viewPanel(new v2(0, 0), mode);
    
    switch(tab)
    {
        case "intel":
            tableColumn(mode, panel, "Name", 100);
            tableColumn(mode, panel, "job", 40);
            tableColumn(mode, panel, "legalScoop", 50);
            tableColumn(mode, panel, "illegalScoop", 50);
            tableColumn(mode, panel, "loyalty", 50);
            tableColumn(mode, panel, "fear", 50);
            tableColumn(mode, panel, "suspicion", 50);
            for(var i = 0; i < intelList.length; i++)
            {
                var intel = intelList[i];
                tableRowItem(mode, panel, intel.name);
                tableRowItem(mode, panel, intel.job);
                tableRowItem(mode, panel, intel.legalScoop);
                tableRowItem(mode, panel, intel.illegalScoop);
                tableRowItem(mode, panel, intel.loyalty);
                tableRowItem(mode, panel, intel.fear);
                tableRowItem(mode, panel, intel.suspicion);
            }
        break;
    }
    
    if(keysDown[ascii("D")])
    {
    }
}

function approach(start, destination, rate)
{
    if(start < destination)
    {
        return Math.min(start + rate, destination);
    }
    else
    {
        return Math.max(start - rate, destination);
    }
}

//
//====== DRAW ======
//

// function draw()
// {
    // // Fill to black.
    // canvasContext.fillStyle = "#000000";
    // canvasContext.fillRect(0, 0, canvas.width, canvas.height);

    // // drawRectangle(new v2(10, 10), new v2(10, 10));
    // // drawCircle(new v2(10, 10));
    
    // // drawText(new v2(0, 0), "TOP LEFT");
    // // drawText(new v2(baseWidth/2, 0), "TOP CENTER");
    // // drawText(new v2(baseWidth, baseHeight), "BOTTOM RIGHT");
    // // drawText(new v2(baseWidth/2, baseHeight), "BOTTOM CENTER");
    // // drawText(new v2(0, baseHeight/2), "CENTER LEFT");
    // // drawCircle(new v2(0, baseHeight/2));
    // // drawCircle(new v2(0, baseHeight/2 + 12));
    // // drawText(new v2(baseWidth, baseHeight/2), "CENTER RIGHT");
    
    // // drawTexture(images[buttonTextureName], new v2(10, 10));
// }

function drawRectangle(start, size)
{
    var position = v2Subtract(v2Multiply(start, camera.scale), camera.offset);
    canvasContext.fillStyle = 'magenta';
    canvasContext.fillRect(position.x, position.y, size.x * camera.scale, size.y * camera.scale);
}

function drawCircle(center)
{
    var radius = 2 * camera.scale;
    canvasContext.beginPath();    
    var position = v2Subtract(v2Multiply(center, camera.scale), camera.offset);
    canvasContext.arc(position.x, position.y, radius, 0, 2 * Math.PI, false);
    canvasContext.fillStyle = 'green';
    canvasContext.fill();
}

function drawText(start, text)
{
    var fontHeight = 12;
    canvasContext.font = fontHeight + "px Arial";
    canvasContext.fillStyle = "#FFFFFF";
    //var textSize = canvasContext.measureText(text);
    var position = new v2(start.x, start.y);
    position.y += fontHeight;
    //var position = v2Subtract(v2Multiply(start, camera.scale), camera.offset);
    
    // Todo(ian): Do we want to apply this to the whole draw call?
    canvasContext.save();
    canvasContext.scale(camera.scale, camera.scale);
    canvasContext.fillText(text, position.x, position.y);
    canvasContext.restore();
}

function drawTexture(image, position)
{  
    var width = image.width;
    var height = image.height;
        
    var x = position.x * camera.scale;
    var y = position.y * camera.scale;
    
    x -= camera.offset.x;
    y -= camera.offset.y;
            
    // TODO(ian): When rounding we should also consider the scale so we can have finer movement.
    x = Math.round(x);
    y = Math.round(y);
    
    // if(sprite.flipH)
    // {
        // canvasContext.save();
        // canvasContext.translate(canvas.width, 0);
        // canvasContext.scale(-1, 1);
        // x = canvas.width - x - (sprite.frameWidth * camera.scale);
    // }
    
    canvasContext.drawImage(image, 0, 0, width, height, x, y, width * camera.scale, height * camera.scale);
    
    // if(sprite.flipH)
    // {
        // canvasContext.restore();
    // }
}

//
//====== INITIALIZE ======
//

var images = {};
function addImage(fileName)
{
    var newImage = new Image();
    newImage.src = fileName;
    images[fileName] = newImage;
}
var buttonTextureName = "data/button.png";
addImage(buttonTextureName);

var camera = new Object();
camera.scale = startScale;
camera.target = null;
camera.offset = new v2(0, 0);//new v2(canvas.width/2, canvas.height/2);

function intel(name, job, legalScoop, illegalScoop, loyalty, fear, suspicion)
{
    this.name = name;
    this.job = job;
    this.legalScoop = legalScoop;
    this.illegalScoop = illegalScoop;
    this.loyalty = loyalty;
    this.fear = fear;
    this.suspicion = suspicion;
}
var intelList = [];
intelList[intelList.length] = new intel("Bob Nator", "president", 0, 0, 0.5, 0, 0);
intelList[intelList.length] = new intel("John Johnson", "journalist", 0, 0, 0.1, 0, 0.1);
intelList[intelList.length] = new intel("Natalie Hammer", "macroCorp", 0, 0, 0.2, 0, 0.1);

// var testSound = new Audio("data/audio/sound1.wav");
// testSound.play();

//
//====== GAME LOOP ======
//

var tab = "intel";
var lastUpdateTime;
function main()
{
	var now = Date.now();
    var secondsSinceUpdate = (now - lastUpdateTime) / 1000;
	// update(secondsSinceUpdate);
	// draw();
    
    updateAndDraw("update", secondsSinceUpdate);
    updateAndDraw("draw", secondsSinceUpdate);
    
    drawText(new v2(5, 5), secondsSinceUpdate);
    
	lastUpdateTime = now;
	requestAnimationFrame(main);
};

function reset()
{
    lastUpdateTime = Date.now();
}

reset();
main();

//
//====== MATH ======
//
function v2(x, y)
{
    if(isNaN(x))
    {
        x = 0;
    }
    if(isNaN(y))
    {
        y = 0;
    }
    this.x = x;
    this.y = y;
}

function v2Multiply(one, scalar)
{
    var result = new v2();
    result.x = one.x * scalar;
    result.y = one.y * scalar;
    return result;
}

function v2MultiplyAssign(v2, scalar)
{
    v2.x *= scalar;
    v2.y *= scalar;
}

function v2Divide(one, scalar)
{
    var result = new v2();
    result.x = one.x / scalar;
    result.y = one.y / scalar;
    return result;
}

function v2DivideAssign(one, scalar)
{
    one.x = one.x / scalar;
    one.y = one.y / scalar;
}

function v2Add(one, two)
{
    var result = new v2();
    result.x = one.x + two.x;
    result.y = one.y + two.y;
    return result;
}

function v2AddAssign(one, two)
{
    one.x += two.x;
    one.y += two.y;
}

function v2Subtract(one, two)
{
    var result = new v2();
    result.x = one.x - two.x;
    result.y = one.y - two.y;
    return result;
}

function v2SubtractAssign(one, two)
{
    one.x -= two.x;
    one.y -= two.y;
}

function v2Length(a)
{
    var result = Math.pow(a.x, 2) + Math.pow(a.y, 2);
    result = Math.sqrt(result);
    return result;
}

function v2Inner(a, b)
{
    return Result = a.x*b.x + a.y*b.y;
}

function v2NormalizeAssign(a)
{
    if(a.x != 0 || a.y != 0)
    {
        v2DivideAssign(a, v2Length(a));
    }
}
