// (c) Copyright 2017 Enxine DEV S.C.
// Released under Apache License, version 2.0
// @author: jamartinez@enxine.com
//
// Description: a yeelight bulb controller. It searchs for a yeelight connected
// bulb in LAN and let you to manage it from Vizibles. It is no HW dependant,
// so you can use it in your computer or in other devices (as a Raspberry).

var vizibles = require('vizibles');
var y2 = require('yeelight2');

var connected = false;
var started = false;
var lightFound = false;
var light = null;

var properties = {
    power: '',
    bright: '',
    rgb: ''
};

function lightOn() {
    light.set_power('on');
    properties.power = 'on';
    vizibles.update({power: 'on'});
}

function lightOff() {
    light.set_power('off');
    properties.power = 'off';
    vizibles.update({power: 'off'});
}

function toggle() {
    light.toggle();
    if (properties.power == 'on') {
	properties.power = 'off';
	vizibles.update({power: 'off'});
    } else if (properties.power == 'off') {
	properties.power = 'on';
	vizibles.update({power: 'on'});
    }
}

function setBright(value) {
    properties.bright = value;
    light.set_bright(properties.bright);
    vizibles.update({bright: properties.bright});
}

function changeBright(amount) {
    if (!started) {
	console.log('not started yet!');
	return;
    }
    properties.bright = 0 + parseInt(properties.bright) + parseInt(amount);
    if (properties.bright < 1) properties.bright = 1;
    else if (properties.bright > 100) properties.bright = 100;
    light.set_bright(properties.bright);
    vizibles.update({bright: properties.bright});
}

function reset(value) {
    properties.power = 'on';
    properties.bright = '50';
    properties.rgb = '16777215';

    light.set_power(properties.power);
    setTimeout(function() { light.set_bright(properties.bright);}, 100);
    setTimeout(function() { light.set_rgb(properties.rgb);}, 200);
    setTimeout(function() { vizibles.update(properties);}, 300);
}

function setRGB(hexRGB) {
    // 'ColorPicker' widget gives a string with format #rrggbb
    var rgb = parseInt(hexRGB.replace('#', '0x'), 16);
    light.set_rgb(rgb);
    properties.rgb = rgb;
    vizibles.update({rgb: rgb});
}

function getProperties() {
    var promise = light.get_prop(["power", "bright", "rgb"]);
    promise.then(function(result) {
	properties = result;
	vizibles.update(result);
	started = true;
	return result;
    });
}

function exposeFunctions() {
    vizibles.expose('lightOn', lightOn);
    vizibles.expose('lightOff', lightOff);
    vizibles.expose('toggle', toggle);
    vizibles.expose('setRGB', setRGB);
    vizibles.expose('setBright', setBright);
    vizibles.expose('changeBright', changeBright);
    vizibles.expose('reset', reset);
    vizibles.expose('getProperties', getProperties);
}

function checkStatus() {
    setInterval(function() {
	var promise = light.get_prop(["power", "bright", "rgb"]);
	promise.then(function(result) {
	    started = true;
	    var status = {};
	    var updateStatus = false;
	    if (result.power && (result.power != '') && (properties.power != result.power)) {
		properties.power = result.power;
		status.power = result.power;
		updateStatus = true;
	    }
	    if (result.bright && (result.bright != '') && (properties.bright != result.bright)) {
		properties.bright = result.bright;
		status.bright = result.bright;
		updateStatus = true;
	    }
	    if (result.rgb && (result.rgb != '') && (properties.rgb != result.rgb)) {
		properties.rgb = result.rgb;
		status.rgb = result.rgb;
		updateStatus = true;
	    }
	    if (updateStatus) {
		//console.log('updating: ' + JSON.stringify(status));
		vizibles.update(status);
	    }
	});
    }, 5000);
}

function onConnected() {
    console.log('Connected to Vizibles!');
    if (!connected) {
        connected = true;
	function goIfReady() {
	    if (lightFound) {
		exposeFunctions();
		getProperties();
		checkStatus();
	    }
	    else setTimeout(goIfReady, 2000);
	}
	goIfReady();
    }
}

function onDisconnected(err) {
    console.log('Disconnected from Vizibles with error: ' + JSON.stringify(err));
    connected = false;
    started = false;
}

vizibles.connect({
    id: 'yeelight-rgbw-bulb',
    // TODO: replace the <TODO> strings with values obtained from Vizibles and
    // then uncomment next line
    //credentials: {keyId: '<TODO>', secret: '<TODO>'},
    onConnected: onConnected, 
    onDisconnected: onDisconnected
});

y2.discover(function(pLight) {
    lightFound = true;
    light = pLight;
    console.log('Bulb found: ' + light.name);
});
