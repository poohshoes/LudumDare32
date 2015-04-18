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

var mousePosition = new v2(0, 0);
canvas.addEventListener("mousemove", doMouseMoved);
function doMouseMoved(event)
{
    mousePosition.x = event.clientX - (canvas.offsetLeft - window.pageXOffset);
    mousePosition.y = event.clientY - (canvas.offsetTop - window.pageYOffset);
    mousePosition = v2Divide(mousePosition, camera.scale)
}

function getMousePosition(evt)
{
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
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

var fontHeight = 10;

function viewPanel(position)
{
    this.start = new v2(position.x, position.y);
    this.current = new v2(position.x, position.y);
}

function table(position)
{
    this.panel = new viewPanel(position);
    this.lastColumn = -1;
    this.columnData = [];
    this.maxHeightForThisRow = 0;
}

function columnData(type, width)
{
    this.type = type;
    this.width = width;
}

function tableStartRows(table)
{
    table.lastColumn = -1;
}

function tableColumn(table, type, width)
{
    table.lastColumn++;
    table.columnData[table.lastColumn] = new columnData(type, width);
}

var currentTooltip = null;
function tooltip(text, position)
{
    this.text = text;
    this.position = position;
}

function tableRowItem(mode, table, value)
{
    if(mode == "update")
    {
    }
    else
    {
        table.lastColumn++;
        var columnData = table.columnData[table.lastColumn];
        switch(columnData.type)
        {
            case "text":
                drawText(table.panel.current, value);
                if(fontHeight > table.maxHeightForThisRow)
                {
                    table.maxHeightForThisRow = fontHeight;
                }
                break;
            case "job":
                var image = imageSet["job"][value];
                var topLeft = new v2(table.panel.current.x, table.panel.current.y);
                var bottomRight = new v2(topLeft.x + image.width, topLeft.y + image.height);
                if(isBetween(topLeft, mousePosition, bottomRight))
                {
                    var tooltipText = image.tooltip;
                    currentTooltip = new tooltip(tooltipText, new v2(mousePosition.x, mousePosition.y));
                }
                drawTexture(topLeft, image);
                if(image.height > table.maxHeightForThisRow)
                {
                    table.maxHeightForThisRow = image.height;
                }
                break;
        }
        table.panel.current.x += columnData.width;
    }
}

function tableEndRow(table)
{
    table.panel.current.x = table.panel.start.x;
    table.panel.current.y += table.maxHeightForThisRow;
    table.maxHeightForThisRow = 0;
    table.lastColumn = -1;
}

function endTable(panel, table)
{
    panel.y += table.panel.y;
}

function updateAndDraw(mode, secondsElapsed) 
{
    if(mode == "draw")
    {
        // Fill to black.
        canvasContext.fillStyle = "#c0c0c0";
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
        currentTooltip = null;
    }
    
    // todo: Put in a strict width not to surpass (scrolling).
    var panel = new viewPanel(new v2(0, 0), mode);
    
    switch(tab)
    {
        case "intel":
            var intelTable = new table(panel.current);
            tableColumn(intelTable, "text", 100);
            tableColumn(intelTable, "job", 40);
            tableColumn(intelTable, "text", 50);
            tableColumn(intelTable, "text", 50);
            tableColumn(intelTable, "text", 50);
            tableColumn(intelTable, "text", 50);
            tableColumn(intelTable, "text", 50);
            tableStartRows(intelTable);
            for(var i = 0; i < intelList.length; i++)
            {
                var intel = intelList[i];
                tableRowItem(mode, intelTable, intel.name);
                tableRowItem(mode, intelTable, intel.job);
                tableRowItem(mode, intelTable, intel.legalScoop);
                tableRowItem(mode, intelTable, intel.illegalScoop);
                tableRowItem(mode, intelTable, Math.round(intel.loyalty * 100));
                tableRowItem(mode, intelTable, Math.round(intel.fear * 100));
                tableRowItem(mode, intelTable, Math.round(intel.suspicion * 100));
                tableEndRow(intelTable);
            }
            endTable(panel, intelTable);
        break;
    }
    
    if(mode == "draw" && currentTooltip != null)
    {
        // Todo: this needs a background.
        drawText(v2Add(currentTooltip.position, new v2(7, 0)), currentTooltip.text);
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
    canvasContext.font = fontHeight + "px Arial";
    canvasContext.fillStyle = "#000000";
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

function drawTexture(position, image)
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
    
    canvasContext.drawImage(image, 0, 0, width, height, x, y, width * camera.scale, height * camera.scale);
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

var imageSet = [];
imageSet["job"] = [];
imageSet["job"]["president"] = new Image();
imageSet["job"]["president"].src = "data/jobPresident.png";
imageSet["job"]["president"].tooltip = "President";
imageSet["job"]["journalist"] = new Image();
imageSet["job"]["journalist"].src = "data/jobJournalist.png";
imageSet["job"]["journalist"].tooltip = "Journalist";
imageSet["job"]["macroCorp"] = new Image();
imageSet["job"]["macroCorp"].src = "data/jobMacroCorp.png";
imageSet["job"]["macroCorp"].tooltip = "MacroCorp";

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
    
    drawText(new v2(5, 280), secondsSinceUpdate);
    
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

function isBetween(topLeft, check, bottomRight)
{
    return topLeft.x < check.x &&
        topLeft.y < check.y &&
        check.x < bottomRight.x &&
        check.y < bottomRight.y;
}
