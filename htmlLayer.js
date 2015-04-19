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

//
//====== INPUT ======
//

var isMouseDown = false;
canvas.addEventListener("mousedown", doMouseDown, true);
function doMouseDown(event)
{
    isMouseDown = true;
}

var mouseToggledUp = false;
canvas.addEventListener("mouseup", doMouseUp, true);
function doMouseUp(event)
{
    mouseToggledUp = true;
    isMouseDown = false;
}

var mousePosition = new v2(0, 0);
canvas.addEventListener("mousemove", doMouseMoved);
function doMouseMoved(event)
{
    mousePosition.x = event.clientX - (canvas.offsetLeft - window.pageXOffset);
    mousePosition.y = event.clientY - (canvas.offsetTop - window.pageYOffset);
    mousePosition = v2Divide(mousePosition, camera.scale);
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

var margin = 3;
var borderSize = 2;
var fontHeight = 10;

function viewPanel(position)
{
    this.start = new v2(position.x, position.y);
    this.current = new v2(position.x, position.y);
}

var currentTooltip = null;
function tooltip(text, position)
{
    this.text = text;
    this.position = position;
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

function tableRowItem(mode, table, value)
{
    var result = false;
    table.lastColumn++;
    var columnData = table.columnData[table.lastColumn];
    
    switch(columnData.type)
    {
        case "text":
            if(mode == "draw")
            {
                drawText(table.panel.current, value);
            }
            
            if(fontHeight > table.maxHeightForThisRow)
            {
                table.maxHeightForThisRow = fontHeight;
            }
            break;
        case "tab":
            if(mode == "draw")
            {
                var text = value.charAt(0).toUpperCase() + value.slice(1);
                
                var dull = true;
                var ignoreBottom = false;
                if(currentTab == value)
                {
                    dull = false;
                    ignoreBottom = true;
                }
                drawOutline(table.panel.current, columnData.width - (2*borderSize), fontHeight, dull, ignoreBottom)
                
                var position = v2Add(table.panel.current, new v2((2*borderSize), borderSize));
                drawText(position, text);
                if(value in tabNotification && tabNotification[value])
                {
                    position.x += canvasContext.measureText(text).width;
                    drawTexture(position, images[notifyTexture]);
                    if(notifyTexture.height > table.maxHeightForThisRow)
                    {
                        table.maxHeightForThisRow = notifyTexture.height;
                    }
                }
            }
            else // update
            {
                var topLeft = table.panel.current;
                //drawCircle(topLeft);
                var bottomRight = v2Add(table.panel.current, new v2(columnData.width, fontHeight + (2 * borderSize)));
                // drawCircle(bottomRight);
                // drawCircle(mousePosition);
                result = mouseToggledUp && isBetween(topLeft, mousePosition, bottomRight);
            }
            
            var totalHeight = fontHeight + (2 * borderSize);
            if(totalHeight > table.maxHeightForThisRow)
            {
                table.maxHeightForThisRow = totalHeight;
            }
            break;
        case "job":
            var image = imageSet["job"][value];
            if(mode == "draw")
            {
                var topLeft = new v2(table.panel.current.x, table.panel.current.y);
                var bottomRight = new v2(topLeft.x + image.width, topLeft.y + image.height);
                if(isBetween(topLeft, mousePosition, bottomRight))
                {
                    var tooltipText = image.tooltip;
                    currentTooltip = new tooltip(tooltipText, new v2(mousePosition.x, mousePosition.y));
                }
                drawTexture(topLeft, image);
            }
            
            if(image.height > table.maxHeightForThisRow)
            {
                table.maxHeightForThisRow = image.height;
            }
            break;
    }
    table.panel.current.x += columnData.width;
    
    return result;
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
    panel.current.y = table.panel.current.y + borderSize;
}

function doToggle(mode, panel, text, toggleMode)
{
    var result = false;
    
    var topLeft = v2Add(panel.current, new v2(margin, margin));
    var insideWidth = canvasContext.measureText(text).width;
    var insideHeight = fontHeight;
    if(mode == "draw")
    {
        var dull = toggleMode == "down";
        
        drawOutline(topLeft, insideWidth, insideHeight, dull, false)
        
        var textColor = colorText;
        if(toggleMode == "disabled")
        {
            textColor = colorDisabledText;
        }
        drawText(v2Add(topLeft, new v2(borderSize, borderSize)), text, textColor);
    }
    else // update
    {
        var bottomRight = v2Add(topLeft, new v2(insideWidth + (2*borderSize), fontHeight + (2* borderSize)));
        if(mouseToggledUp && isBetween(topLeft, mousePosition, bottomRight))
        {
            result = true;
        }
    }
    
    panel.current.y += (2 * (margin + borderSize)) + fontHeight;
    
    return result;
}

// note(ian): This button doesn't update the panel because we are placing it manually.
function doImageButton(mode, position, image)
{
    var result = false;
    
    var topLeft = v2Add(position, new v2(margin, margin));
    var insideWidth = image.width;
    var insideHeight = image.height;
    if(mode == "draw")
    {
        var background = "none";
        
        drawOutline(topLeft, insideWidth, insideHeight, false, false);
        drawTexture(v2Add(topLeft, new v2(borderSize, borderSize)), image);
    }
    else // update
    {
        var bottomRight = v2Add(topLeft, new v2(insideWidth + (2*borderSize), image.height + (2* borderSize)));
        if(mouseToggledUp && isBetween(topLeft, mousePosition, bottomRight))
        {
            result = true;
        }
    }
    
    return result;
}

function drawOutline(topLeft, insideWidth, insideHeight, dull, ignoreBottom)
{
    var backgroundColor = colorBackground;
    if(isMouseDown && isBetween(topLeft, mousePosition, v2Add(topLeft, new v2(insideWidth, insideHeight))))
    {
        backgroundColor = colorDark;
    }
    else if(dull)
    {
        backgroundColor = colorMedium;
    }
        
    drawRectangle(v2Add(topLeft, new v2(borderSize, borderSize)), new v2(insideWidth, insideHeight), backgroundColor); // background
    drawRectangle(v2Add(topLeft, new v2(insideWidth + borderSize, 0)), new v2(borderSize, insideHeight + (2* borderSize)), colorMedium); // right
    if(!ignoreBottom)
    {
        drawRectangle(v2Add(topLeft, new v2(0, insideHeight + borderSize)), new v2(insideWidth + (2*borderSize), borderSize), colorMedium); // bottom
    }
    drawRectangle(topLeft, new v2(insideWidth + (2*borderSize), borderSize), colorLight); // top
    drawRectangle(topLeft, new v2(borderSize, insideHeight + (2* borderSize)), colorLight); // left
}

var colorText = "#000000";
var colorDisabledText = "#808080";
var colorLight = "#dfdfdf";
var colorBackground = "#c0c0c0";
var colorDark = "#424242";
var colorMedium = "#808080";

var tabNotification = [];

function updateAndDraw(mode, secondsElapsed) 
{
    if(mode == "draw")
    {
        // Fill to black.
        canvasContext.fillStyle = colorBackground;
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
        currentTooltip = null;
    }
    
    // todo: Put in a strict width not to surpass (scrolling).
    var panel = new viewPanel(new v2(0, 0), mode);
    
    // HEADER INFO
    var headerTable = new table(panel.current);
    tableColumn(headerTable, "text", 40);
    tableColumn(headerTable, "text", 40);
    tableColumn(headerTable, "text", 40);
    tableColumn(headerTable, "text", 40);
    tableColumn(headerTable, "text", 50);
    tableColumn(headerTable, "text", 40);
    tableColumn(headerTable, "text", 40);
    tableColumn(headerTable, "text", 40);
    tableColumn(headerTable, "text", 40);
    tableColumn(headerTable, "text", 40);
    tableStartRows(headerTable);
    tableRowItem(mode, headerTable, "Capital");
    tableRowItem(mode, headerTable, "$" + money + "m");
    tableRowItem(mode, headerTable, "Budget");
    tableRowItem(mode, headerTable, "$" + income + "m");
    var programCost = getProgramsTotalCost();
    tableRowItem(mode, headerTable, "Expenses");
    tableRowItem(mode, headerTable, "-$" + programCost + "m");
    tableRowItem(mode, headerTable, "Income");
    tableRowItem(mode, headerTable, "$" + (income - programCost) + "m");
    tableRowItem(mode, headerTable, "Balance");
    tableRowItem(mode, headerTable, "$" + (money + income - programCost) + "m");
    tableEndRow(headerTable);
    endTable(panel, headerTable);
    
    // TABS
    var tabTable = new table(panel.current);
    var tabs = ["messages", "intel", "actions", "programs"];
    for(var i = 0; i < tabs.length; i++)
    {
        tableColumn(tabTable, "tab", 100);
    }
    tableStartRows(tabTable);
    for(var i = 0; i < tabs.length; i++)
    {
        if(tabs[i] in tabNotification)
        {
            if(currentTab == tabs[i])
            {
                tabNotification[tabs[i]] = false;
            }
        }
        if(tableRowItem(mode, tabTable, tabs[i]))
        {
            currentTab = tabs[i];
        }
    }
    tableEndRow(tabTable);
    endTable(panel, tabTable);
    
    // MAIN PANEL
    switch(currentTab)
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
        case "messages":
            var border = 20;
            var width = baseWidth - (2 * border);
            for(var i = breifings.length - 1; i >= 0; i--)
            {
                var text = wordWrap(breifings[i], width);
                for(var j = 0; j < text.length; j++)
                {
                    drawText(v2Add(panel.current, new v2(border, 0)), text[j]);
                    panel.current.y += fontHeight;
                }
                
                if(i > 0)
                {
                    drawRectangle(v2Add(panel.current, new v2(margin, margin)), new v2(baseWidth -(2*margin), borderSize), colorMedium);
                    panel.current.y += fontHeight;
                }
            }
        break;
        case "programs":
            for(var i = 0; i < programs.length; i++)
            {
                var program = programs[i];
                var canAfford = program.cost <= income + money - getProgramsTotalCost();
                var buttonMode = "down";
                if(!program.active)
                {
                    if(canAfford)
                    {
                        buttonMode = "up";
                    }
                    else
                    {
                        buttonMode = "disabled";
                    }
                }
                if(doToggle(mode, panel, program.name + " $" + program.cost + "m", buttonMode))
                {
                    if(program.active)
                    {
                        program.active = false;
                    }
                    else if(canAfford)
                    {
                        program.active = true;
                    }
                }
            }
        break;
    }
    
    // todo: Put a tool tip on this
    var endTurnButtonPosition = new v2(baseWidth - 30, baseHeight - 30);
    if(doImageButton(mode, endTurnButtonPosition, images[endTurnTextureName]))
    {
        // var programCost = getProgramsTotalCost();
        // money += income - programCost;
        // var projection = money + income - programCost;
        // if(projection
        money += income;
        for(var i = 0; i < programs.length; i++)
        {
            var program = programs[i];
            if(program.active)
            {
                if(program.cost <= money)
                {
                    money -= program.cost;
                    program.activeLastTurn = true;
                }
                else
                {
                    program.active = false;
                    addBreifing("The " + program.name + " program was shut down due to lack of funds.");
                }
            }
            
            program.activeLastTurn = program.active;
        }
    }
    
    if(mode == "draw" && currentTooltip != null)
    {
        // Todo: this needs a background.
        drawText(v2Add(currentTooltip.position, new v2(7, 0)), currentTooltip.text);
    }
    
    // if(keysDown[ascii("D")])
    // {
    // }
    
    mouseToggledUp = false;
}

function wordWrap(text, width)
{
    var result = [];
    var lines = text.split('\n');
    for(var i = 0; i < lines.length; i++)
    {
        var textWidth = canvasContext.measureText(lines[i]).width;
        if(textWidth <= width)
        {
            result[result.length] = lines[i];
        }
        else
        {
            var currentText = "";
            var currentTextWidth = 0;
            var words = lines[i].split(" ");
            for(var j = 0; j < words.length; j++)
            {
                var part = words[j];
                var nextPeiceWidth = canvasContext.measureText(" " + part).width;
                if(currentTextWidth + nextPeiceWidth > width)
                {
                    result[result.length] = currentText;
                    currentText = "";
                    currentTextWidth = 0;
                }
                if(currentText != "")
                {
                    currentText += " ";
                }
                currentText += part;
                currentTextWidth += nextPeiceWidth;
            }
            if(currentText != "")
            {
                result[result.length] = currentText;
            }
        }
    }
    return result;
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

function drawRectangle(start, size, color)
{
    var position = v2Subtract(v2Multiply(start, camera.scale), camera.offset);
    canvasContext.fillStyle = color;
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

function drawText(start, text, color)
{
    color = color || colorText;
    canvasContext.font = fontHeight + "px Arial";
    canvasContext.fillStyle = color;
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
var endTurnTextureName = "data/endTurn.png";
addImage(endTurnTextureName);
var notifyTexture = "data/notify.png";
addImage(notifyTexture);

var camera = new Object();
camera.scale = startScale;
camera.target = null;
camera.offset = new v2(0, 0);//new v2(canvas.width/2, canvas.height/2);

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

function program(name, cost)
{
    this.name = name;
    this.cost = cost;
    this.active = false;
    this.activeLastTurn = false;
}

var programs = [];
programs[programs.length] = new program("Tap Land Lines", 100);
programs[programs.length] = new program("Email Capture", 100);
programs[programs.length] = new program("Snoop Cell Phones", 100);

var breifings = [];
function addBreifing(text)
{    
    breifings[breifings.length] = text;
    tabNotification["messages"] = true;
}
addBreifing("Congratulations on your premotion to director of the NSA.  We have suspicions of a plot to blow up the White House, but we don't have any more leads, if only we could tap the land lines we might be able to figure out more.\n\nGood Luck,\nBob Robertson\nDirector of CIA");

var income = 100;
var money = 100;

// todo: cancel programs we can't afford
function getProgramsTotalCost()
{
    var cost = 0;
    for(var i = 0; i < programs.length; i++)
    {
        if(programs[i].active)
        {
            cost += programs[i].cost;
        }
    }
    return cost;
}

// var testSound = new Audio("data/audio/sound1.wav");
// testSound.play();

//
//====== GAME LOOP ======
//

var currentTab = "messages";
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

function v2Copy(a)
{
    return new v2(a.x, a.y);
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
