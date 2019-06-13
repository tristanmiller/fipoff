//main.js - main program code

//GLOBALS

const viewport = document.getElementsByClassName('viewport')[0];

const subtypes = {
	pe: 'Photoelectric Detector',
	io: 'Ionisation Detector',
	th: 'Thermal Detector',
	mcp: 'Manual Call Point',
	multi: 'Smoke/Heat Detector',
	flame: 'Flame Detector',
	vesda: 'VESDA', //Very Early Smoke Detection Apparatus - has own interface/panel
	ps: 'Pressure Switch'
}



let sysObjects = [];
let fips = [];
let circuits = [];
let dets = [];
let zones = {};


//General Utility Functions
//modify a value if it exceeds limits
function constrain(n, min, max){
	if(n > max){n = max;} else if(n < min){n = min;}
	return n;	
}


//System-specific stuff

//build a system from the jsonny madness
//create objects for each entry
//add these objects to a global object list
//add objects to lists by type
//sort out parents and children of these objects
//also produce a separate list of zones (administrative, as opposed to circuitry)



buildSystem(system);
buildZoneLists();
console.log(sysObjects);
console.log(zones);

function buildSystem (sys) {
//expect to encounter system name first
//then delve into the hierarchy
	if(sys.children){
		createSystemObjects(sys.children[0]);
	}
	
	
}


function createSystemObjects(node, parent){
	let o = {}; 
	if(parent){o.parent = parent};
	//establish identifiers
	if(node.name){o.name = node.name;}
	
	if(parent && parent.shname){
		if(node.shname){
			o.shname = parent.shname + '_' + node.shname;
		} else {
			o.shname = parent.shname + '_' + node.name;
		}
	} else {
		if(node.shname){
			o.shname = node.shname;
		} else {
			o.shname = node.name;	
		}
		
	}
	
	if(node.type){o.type = node.type;}

	if(node.zone){
		//if parent exists and is an FIP, then zone = fip shname + 'zone' + zone number
		//if parent object has a zone and is a circuit, then take same zone as parent
		//if there's no parent, well, what can you do?
		if(parent && parent.type == 'fip'){
			//console.log(parent.type);
			o.zone = parent.shname + '_zone_' + node.zone;
		} 	
	} else if (parent && parent.type == 'circuit' && parent.zone){
		o.zone = parent.zone;
	}	
	
	if(node.addressable){o.addressable = node.addressable;}
	
	//place in a list of objects and assign a reference id
	o.sysObsId = sysObjects.length;
	sysObjects.push(o);
	
	//if there are children on the node, create an empty list of children on the object
	//then begin populating this list by recursion on this function with o as 'parent'
	if(node.children){
		o.children = [];
	//do recursion
		for(let i = 0, l = node.children.length; i < l; i++){
			createSystemObjects(node.children[i], o);
		}
	}
	
	//also make sure that this ends up on its parent's list of children!
	if(parent && parent.children){
		parent.children.push(o);
	}

	
	//TODO: place in list of objects of same type and assign a reference id
	
	//TESTING: create a div with name and shortname, and append to viewport
	o.divrep = document.createElement('div');
	o.divrep.className = 'test';
	o.divrep.innerHTML = '<p>'+ o.name + '</p><p>' + o.shname + '</p><p>' + o.zone + '</p>';
	o.divrep.style.padding = '5px';
	viewport.appendChild(o.divrep);
}


//Gather all things of the same ZONE NAME and plop in a list
//for each object in the systemObjects
// - does it have a zone name?
// - if so, has this zone name been encountered yet?
// 		- if not, create an entry in a 'zones' list, ie zones.thiszonename: [];
// 		- then add itself to this list
//		-if so, then add itself to the list with that property name
function buildZoneLists(){
	for(let i = 0, l = sysObjects.length; i < l; i++){
		let o = sysObjects[i];
		
		if(o.zone){
			if(zones[o.zone]){
				zones[o.zone].push(o);
			} else {
				zones[o.zone] = [];
				zones[o.zone].push(o);
			}
		}
	}
}

//templates for building the various DOM representations of the alarm system components
InnerHtmlInstructions = {
	fip: '<div class="panel"></div>',
	blockplan: '<div class="blockplan"></div>',
	det: '<div class="det"><div class ="det-header"></div><div class="det-body"><div class="det-image"></div><div class="det-info"></div></div><div class="det-options"></div></div>'
}

//TESTING ALARM PANEL FUNCTIONS



let deviceList = [
	{desc:'Me', status:'alarm', type:'smoke', subtype:'pe', loop:1, num:1, zone:1, lastAlarmTime:'today'}, 
	{desc:'You', status:'alarm', type:'smoke', subtype:'pe', loop:1, num:2, zone:1, lastAlarmTime:'today'}, 
	{desc:'Vlad', status:'alarm', type:'smoke', subtype:'pe', loop:1, num:3, zone:1, lastAlarmTime:'today'}, 
	{desc:'Donald', status:'normal', type:'smoke', subtype:'pe', loop:2, num:1, zone:1, lastAlarmTime:'yesterday'}, 
	{desc:'Jeeves', status:'alarm', type:'smoke', subtype:'pe', loop:2, num:2, zone:1, lastAlarmTime:'today'}, 
	{desc:'Snow', status:'normal', type:'smoke', subtype:'pe', loop:2, num:3, zone:1, lastAlarmTime:'yesterday'}
	]; //everything that is directly addressable by/at FIP.
	
	//fip should hold info on:
	////detector description
	////detector type
	////loop address and zone
	////current status
	////date and time of occurrence
	
	//this can be derived from the objects as they are created

let ackList = [];
let isoList = [];
let testDisplay = document.getElementsByClassName('panel-display-content')[0];

let alarmText = 'Alarm: ';
let ackText = 'Acknowledged alarm: ';
let isoText = 'Isolated: ';

function displayAlarm(display, list, index){
	//display.innerHTML = alarmText + list[index] + '.  Alarm ' + (index + 1) + ' of ' + deviceList.length;
}

function displayAcknowledged(display, list, index){
	display.innerHTML = ackText + list[index] + '.  Alarm ' + (index + 1) + ' of ' + ackList.length;
}

let testCurrentIndex = 0;
displayAlarm(testDisplay, deviceList, testCurrentIndex);

function displayIncrementList(display, list, currentIndex, increment){
	increment = Math.round(increment);
	if(Math.abs(increment) < list.length){
		currentIndex = (currentIndex + list.length + increment)%list.length;
	} else {
		if(increment < 0){
			increment = increment + list.length;
		} else {
			increment = increment%list.length;
		}
	  displayIncrementList(display, list, currentIndex, increment);
	}
	return currentIndex;
}

let panel_controls = document.getElementsByClassName('panel-controls')[0];

prevButton = panel_controls.getElementsByTagName('BUTTON')[2];
nextButton = panel_controls.getElementsByTagName('BUTTON')[3];
ackButton = panel_controls.getElementsByTagName('BUTTON')[4];


document.getElementsByClassName('panel-controls')[0].addEventListener('click', function(event){
		let t = event.target;
		if(t == prevButton){testCurrentIndex = displayIncrementList(testDisplay, deviceList, testCurrentIndex, -1);}
		if(t == nextButton){testCurrentIndex = displayIncrementList(testDisplay, deviceList, testCurrentIndex, 1);}
		if(t == ackButton){handleAcknowledged();}
		
		displayAlarm(testDisplay, deviceList, testCurrentIndex);
});
	
function handleAcknowledged(){
	
}

