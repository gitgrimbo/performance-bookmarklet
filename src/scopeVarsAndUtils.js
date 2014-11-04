/*
Initiallize Bookmarklet wide variables, holders and helpers - all other files only don't share scope
*/

//bookmarklet wide vars
var tablesToLog = [],	
	resources,
	allRessourcesCalc,
	marks,
	perfTiming,
	iFrameEl,
	outputIFrame,
	outputHolder,
	outputContent;

//feature check gate
if(window.performance && window.performance.getEntriesByType !== undefined) {
	resources = window.performance.getEntriesByType("resource");
	marks = window.performance.getEntriesByType("mark");
}else if(window.performance && window.performance.webkitGetEntriesByType !== undefined) {
	resources = window.performance.webkitGetEntriesByType("resource");
	marks = window.performance.webkitGetEntriesByType("mark");
}else{
	alert("Oups, looks like this browser does not support the Resource Timing API\ncheck http://caniuse.com/#feat=resource-timing to see the ones supporting it \n\n");
	return;
}

if(window.performance.timing){
	perfTiming = window.performance.timing;
}else{
	alert("Oups, looks like this browser does not support performance timing");
	return;
}

if(perfTiming.loadEventEnd - perfTiming.navigationStart < 0){
	alert("Page is still loading - please try again when page is loaded.");
	return;
}

//remove this bookmarklet from the result
resources = resources.filter(function(currR){
	return !currR.name.match(/http[s]?\:\/\/nurun.github.io\/performance-bookmarklet\/.*/);
});

//crunch the resources data into something easier to work with
allRessourcesCalc = resources.map(function(currR, i, arr){
	var urlFragments = currR.name.match(/:\/\/(.[^/]+)([^?]*)\??(.*)/),
		maybeFileName = urlFragments[2].split("/").pop(),
		fileExtension = maybeFileName.substr((Math.max(0, maybeFileName.lastIndexOf(".")) || Infinity) + 1);
	
	var currRes = {
		name : currR.name,
		domain : urlFragments[1],
		initiatorType : currR.initiatorType || fileExtension || "SourceMap or Not Defined",
		fileExtension : fileExtension || "XHR or Not Defined",
		loadtime : currR.duration,
		isLocalDomain : urlFragments[1] === location.host
	};

	for(var attr in currR){
		if(currR.hasOwnProperty(attr)) {
			currRes[attr] = currR[attr];
		}
	}

	if(currR.requestStart){
		currRes.requestStartDelay = currR.requestStart - currR.startTime;
		currRes.dns = currR.domainLookupEnd - currR.domainLookupStart;
		currRes.tcp = currR.connectEnd - currR.connectStart;
		currRes.ttfb = currR.responseStart - currR.startTime;
		currRes.requestDuration = currR.responseStart - currR.requestStart;
	}
	if(currR.secureConnectionStart){
		currRes.ssl = currR.connectEnd - currR.secureConnectionStart;
	}
	
	return currRes;
});

tablesToLog.push({
	name : "All loaded ressources",
	data : allRessourcesCalc,
	columns : ["name", "domain", "initiatorType", "fileExtension", "loadtime", "isLocalDomain", "requestStartDelay", "dns", "tcp", "ttfb", "requestDuration", "ssl"]
});


//helper functions

//creat html tag
var newTag = function(tagName, settings, css){
	settings = settings || {};
	var tag = document.createElement(tagName);
	for(var attr in settings){
		if(attr != "text"){
			tag[attr] = settings[attr];
		}
	}
	tag.textContent = settings.text;
	tag.style.cssText = css || "";
	return tag;
};

//create svg element
var newElementNs = function(tagName, settings, css){
	var el = document.createElementNS("http://www.w3.org/2000/svg", tagName);
	settings = settings || {};
	for(var attr in settings){
		if(attr != "text"){
			el.setAttributeNS(null, attr, settings[attr]);
		}
	}
	el.textContent = settings.text;
	el.style.cssText = css || "";
	return el;
};

var newTextElementNs = function(text, y, css){
	return newElementNs("text", {
			fill : "#111",
			y : y,
			text : text
		}, (css||"") + " text-shadow:0 0 2px #fff;");
};

var getNodeTextWidth = function(textNode){
	var tmp = newElementNs("svg:svg", {}, "visibility:hidden;");
	tmp.appendChild(textNode);
	outputIFrame.body.appendChild(tmp);
	var nodeWidth = textNode.getBBox().width;
	tmp.parentNode.removeChild(tmp);
	return nodeWidth;
};

var getRandomColor = function(){
	var letters = '0123456789ABCDEF'.split(''),
		color = '#';
	for (var i = 0; i < 6; i++ ) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
};

var getItemCount = function(arr, keyName){
	var counts = {},
		resultArr = [];

	arr.forEach(function(key){
		counts[key] = counts[key] ? counts[key]+1 : 1;
	});

	//pivot data
	for(var fe in counts){
		obj = {};
		obj[keyName||"key"] = fe;
		obj.count = counts[fe];

		resultArr.push(obj);
	}
	return resultArr.sort(function(a, b) {
		return a.count < b.count ? 1 : -1;
	});
};



//setup iFrame overlay
iFrameEl = document.getElementById("perfbook-iframe");
if(iFrameEl){
	outputIFrame = iFrameEl.contentWindow.document;
	outputHolder = outputIFrame.getElementById("perfbook-holder");
}else{
	//var outputIFrameEl = newTag("iframe", {id : "perfbook-iframe"}, "position:fixed; top:0; left:0; right:0; z-index: 9999; width:100%; height:100%;");
	iFrameEl = newTag("iframe", {id : "perfbook-iframe"}, "position:absolute; top:1%; right:1%; margin-bottom:1em; left:1%; z-index: 9999; width:98%; z-index: 9999; border:0; box-shadow:0 0 25px 0 rgba(0,0,0,0.5); background:#fff;");
	document.body.appendChild(iFrameEl);
	outputIFrame = iFrameEl.contentWindow.document;
	outputIFrame.body.style.overflow = "hidden";
}

// find or create holder element
if(!outputHolder){
	outputHolder = newTag("div", {id : "perfbook-holder"}, "overflow: hidden; font:normal 12px/18px sans-serif; width:100%; padding:1em 2em 3em; box-sizing:border-box;");
	outputContent = newTag("div", {id : "perfbook-content"}, "position:relative;");
		
	var closeBtn = newTag("button", {
		class : "perfbook-close",
		text: "close"
	}, "position:absolute; top:0; right:0; padding:1em 0.5em; z-index:1; background:transparent; border:0; cursor:pointer;");
	closeBtn.addEventListener("click", function(){
		iFrameEl.parentNode.removeChild(iFrameEl);
	});

	outputHolder.appendChild(closeBtn);
	outputHolder.appendChild(outputContent);
}else{
	outputContent = outputIFrame.getElementById("perfbook-content");
	//clear existing data
	while (outputContent.firstChild) {
		outputContent.removeChild(outputContent.firstChild);
	}
}