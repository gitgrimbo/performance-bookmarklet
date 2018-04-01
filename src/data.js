import dataFn from "./data-fn";

let data = {
	isValid: function() { return false; }
};

let resources, marks, measures, perfTiming;

//Check if the browser suppots the timing APIs
if(window.performance && window.performance.getEntriesByType !== undefined) {
	resources = window.performance.getEntriesByType("resource");
	marks = window.performance.getEntriesByType("mark");
	measures = window.performance.getEntriesByType("measure");
}else if(window.performance && window.performance.webkitGetEntriesByType !== undefined) {
	resources = window.performance.webkitGetEntriesByType("resource");
	marks = window.performance.webkitGetEntriesByType("mark");
	measures = window.performance.webkitGetEntriesByType("measure");
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

data = dataFn(document.domain, window.location.host, window.location.href, perfTiming, resources, marks, measures);

export default data;
