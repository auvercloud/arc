/* =============================================================================================
 * AUVERCLOUD RUNTIME CLIENT (arc)
 * =============================================================================================
 * AUTHOR: guillaume@auvercloud.fr
 * VERSION: 2.0
 * =============================================================================================
 * CSS REQUIREMENTS
 * https://www.auvercloud.com/run/css/arc.css is required for content publishing
 * =============================================================================================
 * 3D PARTY  REQUIREMENTS
 * Mandatory: jQuery 2.x or more (http://jquery.com/download/)
 * Optional: Cryto JS (https://code.google.com/p/crypto-js/) is used for hash coding
 * =============================================================================================
 *
 * Copyright 2014, 2015 Guillaume DORBES.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 *
 * NOTA BENE: 'cake' based methods require a MD5 hash coding library.
 * This library is already included in the minimized version of this file i.e. arc.min.js
 *
 * ============================================================================================= */

/* =============================================================================================
 * ARC OBJECT DEFINITION: global constants & variables
 * --------------------------------------------------------------------------------------------- */

var arc = {
	// DEBUG MODE: true/false
	DEBUG : false && window.console,
	// MUST BE SET WITH A VALID KEY FOR ANY API CALL
	APP_KEY : "",
	// API SERVER URL: SHOULD NOT BE MODIFIED
	API_URL : "https://api.auvercloud.com",
	// CAPCHA PICTURE FOLDER URL: SHOULD NOT BE MODIFIED
	CAPCHA_PATH : "https://api.auvercloud.com/capcha/",
	// AUVERCLOUD CLIENT CSS AND CRYPTO LIB
	CLIENT_CSS : "https://www.auvercloud.com/run/css/arc.css",
	CLIENT_CRYPTO : "https://www.auvercloud.com/run/lib/crypto.min.js",
	// Wait UI on API call
	API_WAIT : false,
	API_WAIT_GIF : "https://www.auvercloud.com/all/img/wait4.gif",
	// DOM attribute content prefix e.g. prefix-text, prefix-log...
	DOM_PREFIX : "arc",
	// Pseudo-infinite time in ms
	FOREVER : 9876543210000,
	// Width threshold between small and large devices (in pixels)
	THRESHOLD : 600,
	// Default and list of supported languages. See paramGet() for use
	APP_LANGUAGE_DEFAULT : "en",
	APP_LANGUAGE_SUPPORTED : ["en"],
	// Timer for delayed functions e.g. save entered text every 5s
	TIMER : 5000
};

// Wait UI timeout
arc.wait = 0;
// Function delay. See Timer above
arc.timeOut = 0;
arc.snapTime = 0;

/*
 * _____________________________________ PART 1: UTILITY _______________________________________
 */

/* =============================================================================================
 * UTILITY: deviceOS, deviceBrowser, deviceType, deviceAlone, deviceTouch
 * Purpose: Return ort set info about the current device
 * Parameter(s) N/A
 * Return: See data below
 * --------------------------------------------------------------------------------------------- */
arc.deviceOS = function() {
	var ua = navigator.userAgent.toLowerCase();
	if (ua.indexOf("iemobile") != -1)
		return "wphone";
	if (ua.indexOf("windows") != -1)
		return "windows";
	if ((ua.indexOf("iphone") != -1) || (ua.indexOf("ipod") != -1) || (ua.indexOf("ipad") != -1))
		return "ios";
	if (ua.indexOf("android") != -1)
		return "android";
	if ((ua.indexOf("mac") != -1) && (ua.indexOf("iphone") == -1) && (ua.indexOf("ipod") == -1) && (ua.indexOf("ipad") == -1))
		return "osx";
	if (ua.indexOf("linux") != -1)
		return "linux";
	return "other";
};

// deviceBrowser => chrome, firefox, opera, silk, mobile safari, safari, msie, other
arc.deviceBrowser = function() {
	var ua = navigator.userAgent.toLowerCase();
	if (ua.indexOf("chrome") != -1)
		return "chrome";
	if (ua.indexOf("firefox") != -1)
		return "firefox";
	if (ua.indexOf("opera") != -1)
		return "opera";
	if (ua.indexOf("silk") != -1)
		return "silk";
	if (ua.indexOf("crios") != -1 && ua.indexOf("safari") != -1)
		return "mchrome";
	if (ua.indexOf("mobile") != -1 && ua.indexOf("safari") != -1)
		return "msafari";
	if (ua.indexOf("safari") != -1)
		return "safari";
	if (ua.indexOf("msie") != -1)
		return "msie";
	return "other";
};

// deviceType => computer, tablet, smartphone, other
arc.deviceType = function() {
	var os = arc.deviceOS();
	if ($(window).width() < arc.THRESHOLD && (os == "android" || os == "ios" || os == "wphone"))
		return "smartphone";
	if (os == "android" || os == "ios" || os == "wphone")
		return "tablet";
	if (os == "windows" || os == "osx" || os == "linux")
		return "computer";
	return "other";
};

// deviceAlone => true/false
arc.deviceAlone = function() {
	if (window.navigator.standalone)
		return true;
	else
		return false;
};

// deviceTouch => true/false
arc.deviceTouch = function() {
	// Should work in most cases
	return 'ontouchstart' in window || navigator.msMaxTouchPoints;
};

// Return or set language to apply for the current device. Various methods available:
//    1. Set parameter e.g. "fr", "en" to force value
//    2. Existing language 'cake'
//    3. Navigator language
arc.deviceLang = function(lang) {
	// If no parameter get other source
	if (!lang) {
		// Get cake if any
		var cakeLang = arc.cakeGet("lang");
		if (cakeLang)
			lang = cakeLang;
		else
			// Default browser language
			lang = (window.navigator.userLanguage || window.navigator.language).substr(0, 2).toLowerCase();
	}
	// Persistent cake
	arc.cakeSet("lang", lang, arc.FOREVER);
	return lang;
};

// Get a unique device ID. Read it if set, otherwise create it and return it
arc.deviceID = function() {
	var did = localStorage.getItem("AuverCloudDeviceID");
	if (did) {
		if (arc.DEBUG)
			console.log("- arc: Device ID =", did);
		return did;
	}

	// New Device ID = Hash-like 32 chars string
	if ( typeof Crypto.MD5 == "function")
		// MD5 hash code if lib available
		did = Crypto.MD5(arc.nowS() + navigator.userAgent + Math.floor(Math.random() * 100));
	else
		did = "12345678901" + arc.nowS() + "12345678901";

	localStorage.setItem("AuverCloudDeviceID", did);

	if (arc.DEBUG)
		console.log("- arc: New device ID =", did);
	return did;
};

/* =============================================================================================
 * UTILITY: pxToNum
 * Purpose: Transform a CSS pixel value (e.g. "123px") into a number
 * Parameter(s) s = Px based string
 * Return: number
 * --------------------------------------------------------------------------------------------- */
arc.pxToNum = function(s) {
	return parseFloat(s.substr(0, s.length - 2));
};

/* =============================================================================================
 * UTILITY: nowMS and nowS
 * Purpose: Current time in ms and s
 * Parameter(s) N/A
 * Return: number
 * --------------------------------------------------------------------------------------------- */
arc.nowMS = function() {
	var d = new Date();
	return d.getTime();
};
arc.nowS = function() {
	return Math.round(arc.nowMS() / 1000);
};

/* =============================================================================================
 * UTILITY: fillInt
 * Purpose: Convert integer to a string defined by a minimal length and a filler string
 * Parameter(s):- i = integer
 * 				- l = length
 * 				- str = filler string. Optional: default = "0"
 * Return: 	result
 * --------------------------------------------------------------------------------------------- */
arc.fillInt = function(i, l, str) {
	str = str || "0";
	var res = i.toString();
	var delta = l - res.length;
	while (delta > 0) {
		res = str + res;
		delta--;
	}
	return res;
};

/* =============================================================================================
 * UTILITY: getTime
 * Purpose: Return a string with current date/time depending on parameters
 * Parameter(s): options, see code below
 * Return: 	result
 * --------------------------------------------------------------------------------------------- */
arc.getTime = function(options) {

	// Default settings
	var settings = $.extend({
		// Time
		time : new Date(),
		// Format
		format : "all"
	}, options);

	var thisDate = settings.time.getFullYear() + '-' + arc.fillInt(settings.time.getMonth() + 1, 2) + '-' + arc.fillInt(settings.time.getDate(), 2);
	var thisTime = arc.fillInt(settings.time.getHours(), 2) + ':' + arc.fillInt(settings.time.getMinutes(), 2) + ':' + arc.fillInt(settings.time.getSeconds(), 2);
	switch(settings.format) {
	case "date":
		return thisDate;
	case "time":
		return thisTime;
	default:
		return thisDate + " " + thisTime;
	}
};

/* =============================================================================================
 * UTILITY: urlParameters
 * Purpose: Return an associative array of the current url parameters
 * Parameter(s):  N/A
 * Return : Associative array of name/value
 * --------------------------------------------------------------------------------------------- */
arc.urlParameters = function() {
	var params = window.location.search.substr(1).split("&");
	var res = {};

	// Exit if no parameter
	if (!params[0])
		return res;

	for (var i = 0; i < params.length; i++) {
		var param = params[i].split("=");
		res[param[0]] = param[1];
	}

	// Return result
	return res;
};

/* =============================================================================================
 * UTILITY: urlDecode
 * Purpose: Decode string urlendcoded
 * Return: 	result
 * --------------------------------------------------------------------------------------------- */
arc.urlDecode = function(str) {
	return decodeURIComponent((str + '').replace(/\+/g, '%20'));
};

/* =============================================================================================
 * UTILITY: strClean
 * Purpose: Clean string of accented and special chars and
 * Parameter(s): s = string
 * Return: 	result
 * --------------------------------------------------------------------------------------------- */
arc.strClean = function(s) {
	var r = s.toLowerCase();
	r = r.replace(new RegExp("\\s", 'g'), "");
	r = r.replace(new RegExp("[àáâãäå]", 'g'), "a");
	r = r.replace(new RegExp("æ", 'g'), "ae");
	r = r.replace(new RegExp("ç", 'g'), "c");
	r = r.replace(new RegExp("[èéêë]", 'g'), "e");
	r = r.replace(new RegExp("[ìíîï]", 'g'), "i");
	r = r.replace(new RegExp("ñ", 'g'), "n");
	r = r.replace(new RegExp("[òóôõö]", 'g'), "o");
	r = r.replace(new RegExp("œ", 'g'), "oe");
	r = r.replace(new RegExp("[ùúûü]", 'g'), "u");
	r = r.replace(new RegExp("[ýÿ]", 'g'), "y");
	r = r.replace(new RegExp("\\W", 'g'), "");
	return r.replace(/[\|&%#§$£;\$%@".<>!:\ \[\]\)\)\)\)\)-)_+,-]/g, "");
};

/* =============================================================================================
 * UTILITY: removExt
 * Purpose: Remove extension from a filename
 * Parameter(s): s = string
 * Return: 	result
 * --------------------------------------------------------------------------------------------- */
arc.removExt = function(s) {
	var r = s.split(".");
	r.pop();
	return r.join("");
};

/* =============================================================================================
 * UTILITY: delayed
 * Purpose: If not forced (see parameters), apply a timer defined by a global variable
 * 			before triggering a function
 * Parameter(s): 	- callback = function to trigger if forced or timer OK
 * 					- force = true/false. Optional.
 * Return: 	N/A
 * --------------------------------------------------------------------------------------------- */
arc.delayed = function(callback, force) {
	var now = arc.nowMS();

	// Force callback if required
	if (force) {
		// Stop timeout if any
		window.clearTimeout(arc.timeOut);
		// Reset snap timer
		arc.snapTime = now;
		// Apply call back
		callback();
		return;
	}

	// Apply callback if long time
	if ((now - arc.snapTime) > arc.TIMER) {
		// Stop timeout if any
		window.clearTimeout(arc.timeOut);
		// Reset snap timer
		arc.snapTime = now;
		// Set timeout to apply callback lather if no further event
		arc.timeOut = setTimeout(callback, arc.TIMER);
		callback();
		return;
	}
};

/* =============================================================================================
 * UTILITY: insertHTML
 * Purpose: Equivalent to document.execCommand("insertHTML", false, str) but works with IE
 * Parameter(s): N/A
 * Return: 	N/A
 * --------------------------------------------------------------------------------------------- */
arc.insertHTML = function(str) {
	if (arc.deviceBrowser() != "msie")
		document.execCommand("insertHTML", false, str);
	else {
		// IE <= 10
		if (document.selection) {
			var range = document.selection.createRange();
			range.pasteHTML(str);

			// IE 11 && Firefox, Opera .....
		} else if (document.getSelection) {
			var range = document.getSelection().getRangeAt(0);
			var nnode = document.createElement("b");
			range.surroundContents(nnode);
			nnode.innerHTML = str;
		}
	}
};

/* =============================================================================================
 * UTILITY: getScript
 * Purpose: Load a JS script from any domain and execute callback if success
 * Parameter(s): - url = script to load
 * 				 - success = call back function. Optional
 * Return: 	N/A
 * --------------------------------------------------------------------------------------------- */
arc.getScript = function(url, success) {
	var script = document.createElement('script');
	script.src = url;
	var head = document.getElementsByTagName('head')[0],
	    done = false;
	script.onload = script.onreadystatechange = function() {
		if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
			done = true;
			// Callback function if any
			if ( typeof success == "function")
				success();
			// Clean
			script.onload = script.onreadystatechange = null;
			head.removeChild(script);
		};
	};
	head.appendChild(script);
	if (arc.DEBUG)
		console.log("- arc: Loading", url);
};

/* =============================================================================================
 * UTILITY: getCSS
 * Purpose: Load a CSS file
 * Parameter(s): - cssId = CSS ID
 * 				 - cssUrl = CSS URL
 * Return: 	N/A
 * --------------------------------------------------------------------------------------------- */
arc.getCSS = function(cssId, cssUrl) {
	if (!document.getElementById(cssId)) {
		var head = document.getElementsByTagName('head')[0];
		var link = document.createElement('link');
		link.id = cssId;
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = cssUrl;
		link.media = 'all';
		head.appendChild(link);
		if (arc.DEBUG)
			console.log("- arc: CSS loaded", cssUrl);
	} else {
		if (arc.DEBUG)
			console.log("- arc: CSS already loaded", cssUrl);
	}
};

/*
 * ___________________________________ PART 2: CAKE SYSTEM _____________________________________
 */

/* =============================================================================================
 * CAKE SYSTEM: cake
 * Purpose: Check that the browser supports both session and local storage
 * Parameter(s) N/A
 * Return: true (success) / false (failure)
 * --------------------------------------------------------------------------------------------- */
arc.cake = function() {
	var test = "cakeOK";
	var result = false;
	sessionStorage.setItem(test, test);
	localStorage.setItem(test, test);
	if ((sessionStorage.getItem(test) == test) && (localStorage.getItem(test) == test)) {
		sessionStorage.removeItem(test);
		localStorage.removeItem(test);
		result = true;
	}
	return result;
};

/* =============================================================================================
 * CAKE SYSTEM: cakeDel
 * Purpose: Delete 'cake' value in both session and local storages
 * Parameter(s) - name = cake name (string)
 * Return: true
 * --------------------------------------------------------------------------------------------- */
arc.cakeDel = function(name) {
	// !!! DEPENDANCE WITH GLOBAL VAR
	var key = arc.APP_KEY + name;
	sessionStorage.removeItem(key);
	localStorage.removeItem(key);
	return true;
};

/* =============================================================================================
 * CAKE SYSTEM: cakeSet
 * Purpose: Set a 'cake' as a 'cookie'
 * Parameter(s): - cakeName = cake name (string)
 *               - cakeVal = cake value
 *               - cakeExpire (optional) = expiration date in milliseconds (integer)
 *               - cakeSalt (optional) = Salt to hash the expiration to check expiration date
 *                 validity when retrieving value
 * Return : cakeVal (success) or false (failure)
 * --------------------------------------------------------------------------------------------- */
arc.cakeSet = function(cakeName, cakeVal, cakeExpire, cakeSalt) {
	// !!! DEPENDANCE WITH GLOBAL VAR
	var key = arc.APP_KEY + cakeName;
	var value = {};
	value.body = cakeVal;
	// Init cakeSalt if not set as parameter
	if (!cakeSalt)
		cakeSalt = "";
	if (cakeExpire) {
		// Store in localStorage
		if ( typeof cakeExpire == "number") {
			// Expiration is a number
			value.expire = cakeExpire;
			value.hash = Crypto.MD5(cakeExpire + cakeSalt);
			localStorage.setItem(key, JSON.stringify(value));
			return cakeVal;
		} else {
			// Expiration is not valid
			return false;
		}
	} else {
		// Store in sessionStorage
		sessionStorage.setItem(key, JSON.stringify(value));
		return cakeVal;
	}
};

/* =============================================================================================
 * CAKE SYSTEM: cakeGet
 * Purpose: Get 'cake' value
 * Parameter(s): - cakeName = cake name (string)
 *               - cakeSalt (optional) = Salt to check expiration date validity
 * Return: value (success) / false (failure)
 * --------------------------------------------------------------------------------------------- */
arc.cakeGet = function(cakeName, cakeSalt) {
	// !!! DEPENDANCE WITH GLOBAL VAR
	var key = arc.APP_KEY + cakeName;
	// Try to get value(s) from session first
	var cake = sessionStorage.getItem(key);
	if (cake) {
		// Return the value
		return JSON.parse(cake).body;
	} else {
		// Try local storage if no session storage
		cake = localStorage.getItem(key);
		if (cake) {
			// If cake is there, prepare ingredients
			if (!cakeSalt)
				cakeSalt = "";
			// Get the details of the cake
			cake = JSON.parse(cake);
			// Check the expiration date is valid
			if (cake.hash == Crypto.MD5(cake.expire + cakeSalt)) {
				// Expiration date is valid
				if (cake.expire > arc.nowMS()) {
					// cake is still fresh
					return cake.body;
				} else {
					// cake is too old, it is time to delete it
					localStorage.removeItem(key);
					return false;
				}
			} else {
				// Expiration date is note valid
				return false;
			}
		} else {
			// No local storage cake
			return false;
		}
	}
};

/*
 * ___________________________________ PART 3: API SYSTEM ______________________________________
 */

/* =============================================================================================
 * API SYSTEM: api
 * Purpose: Single entry point to any AuverCloud API
 * 			Require global var arc.APP_KEY
 * 			Add device data for stats
 * Parameter(s): - apiName
 * 				 - params 	= JSON. object. Optional.
 * 				 - success 	= Call back when successful request. Optional
 * 				 - error 	= Call back when error. Optional
 * 				 - method	= Optional. Default value is POST
 * 				 - up		= Optional. Upload progress callback
 * 				 - down 	= Optional. Download progress callback
 * Return: 	N/A
 * --------------------------------------------------------------------------------------------- */
arc.api = function(apiName, params, success, error, method, up, down) {

	// Init some variable for callbacks
	var apiSuccess = "";
	var apiError = "";

	// Default method is POST
	method = method || "POST";

	// Define params if not set
	params = params || {};

	params.api = apiName;

	// Required params from global vars
	if (!params.key)
		params.key = arc.APP_KEY;

	// Required params for usage stats
	params.deviceOS = arc.deviceOS();
	params.deviceType = arc.deviceType();
	params.deviceBrowser = arc.deviceBrowser();

	// Apply default success callback if not yet defined or not a function
	if ( typeof success != "function") {
		apiSuccess = function(data) {
			arc.waitStop();
			if (arc.DEBUG)
				console.log("- arc: Default success callback to", apiName, "=", data);
		};
	} else {
		apiSuccess = function(data) {
			arc.waitStop();
			success(data);
		};
	}
	// Apply default error callback if not yet defined or not a function
	if ( typeof error != "function") {
		apiError = function(data) {
			arc.waitStop();
			arc.APIerror();
		};
	} else {
		apiError = function(data) {
			arc.waitStop();
			error(data);
		};
	}

	// Check if method is supported
	method = method.toUpperCase();
	if (["GET", "POST"].indexOf(method) == -1) {
		if (arc.DEBUG)
			console.log("- arc: Method", method, "not supported");
		return false;
	}

	// Start wait UI
	arc.waitStart();

	// Catch API error
	try {
		$.ajax({
			xhr : function() {
				var xhr = new window.XMLHttpRequest();

				//Upload progress
				xhr.upload.addEventListener("progress", function(e) {
					if (e.lengthComputable) {
						if ( typeof up != "function") {
							if (arc.DEBUG)
								console.log("- arc: Default API progress Up", e.loaded / e.total);
						} else
							up(e.loaded / e.total);
					}
				}, false);

				//Download progress
				xhr.addEventListener("progress", function(e) {
					if (e.lengthComputable) {
						if ( typeof down != "function") {
							if (arc.DEBUG)
								console.log("- arc: Default API progress Down", e.loaded / e.total);
						} else
							down(e.loaded / e.total);
					}
				}, false);
				return xhr;
			},
			url : arc.API_URL,
			type : method,
			dataType : "json",
			data : params,
			success : apiSuccess,
			error : apiError
		});

		// Success console and result
		if (arc.DEBUG)
			console.log("- arc:", method + ":", params);
		return true;
	} catch(e) {

		// Error console and result
		if (arc.DEBUG)
			console.log("- arc:", method, "=> Error", e);
		return false;
	}
};

/* =============================================================================================
 * API SYSTEM: APIerror
 * Purpose: Default API error function
 * --------------------------------------------------------------------------------------------- */
arc.APIerror = function(xhr, status, error) {
	alert("Network error. Please retry later! - Erreur réseau. Veuillez ressayer plus tard !");
};

/* =============================================================================================
 * API SYSTEM: waitStart
 * Purpose: Start wait animated UI. See ID and CSS below for customization.
 * --------------------------------------------------------------------------------------------- */
arc.API_WAIT_ID = "auvercloud-wait-ui-id";
arc.API_WAIT_CSS = {
	"position" : "fixed",
	"top" : "10px",
	"display" : "none",
	"margin" : "0 auto",
	"width" : "32px",
	"height" : "32px",
	"background-size" : "contain",
	"background-repeat" : "no-repeat",
	"background-image" : "url(" + arc.API_WAIT_GIF + ")",
	"z-index" : 9999
};

arc.waitStart = function() {
	// Apply function if flag set
	if (arc.API_WAIT) {
		var w = $(window).width();
		// Insert element if not yet there, then apply CSS and resize
		if ($("#" + arc.API_WAIT_ID).length == 0) {
			// Append div to body
			$("body").append("<div id='" + arc.API_WAIT_ID + "'></div>");
			// Set CSS
			$("#" + arc.API_WAIT_ID).css(arc.API_WAIT_CSS);
			// Init position
			$("#" + arc.API_WAIT_ID).css("left", ((w - $("#" + arc.API_WAIT_ID).width()) / 2) + "px");
			// Define resize event
			$(window).resize(function() {
				$("#" + arc.API_WAIT_ID).css("left", ((w - $("#" + arc.API_WAIT_ID).width()) / 2) + "px");
			});
		}
		// Hide old display
		arc.waitStop();

		// Show UI
		$("#" + arc.API_WAIT_ID).fadeIn(100, function() {
			// Stop after 3s
			arc.wait = setTimeout(function() {
				$("#" + arc.API_WAIT_ID).hide();
			}, 3000);
		});
	}
};

/* =============================================================================================
 * API SYSTEM: waitStop
 * Purpose: Clear wait animated UI.
 * --------------------------------------------------------------------------------------------- */
arc.waitStop = function() {
	$("#" + arc.API_WAIT_ID).hide();
	clearTimeout(arc.wait);
};

/* =============================================================================================
 * API SYSTEM: apiSession
 * Purpose: Clear wait animated UI.
 * Parameter(s): - apiName
 * 				 - params 	= JSON. object. Optional.
 * 				 - success 	= Call back when successful request. Optional
 * 				 - error 	= Call back when error. Optional
 * Return: 	true/false depending on local session info
 * --------------------------------------------------------------------------------------------- */
arc.apiSession = function(apiName, params, success, error, method, up, down) {

	// Define params if not set
	params = params || {};

	// Set session info
	params.uid = arc.cakeGet("uid");
	params.sid = arc.cakeGet("sid");
	params.eos = arc.cakeGet("eos");
	params.did = arc.deviceID();

	// Check session info exist or return false. Take care of EOS that may be 0!
	if (!(params.uid && params.sid && ( typeof params.eos != 'undefined') && params.did)) {
		if (arc.DEBUG)
			console.log("- arc: Invalid or unexisting local session parameters");
		return false;
	}

	// Call API
	arc.api(apiName, params, success, error, method, up, down);
	return true;
};

/* =============================================================================================
 * API SYSTEM: userSessionStore
 * Purpose: Store session info received from login
 * Parameter(s) - uid = User ID returned by API
 * 				- sid = Session ID returned by API
 * 				- eos = Expiration time of session in s
 * Return: N/A
 * --------------------------------------------------------------------------------------------- */
arc.userSessionStore = function(uid, sid, eos) {
	//Clear former cakes to prevent collision between session and local storages
	arc.cakeDel("uid");
	arc.cakeDel("sid");
	arc.cakeDel("eos");
	// Browser session data
	if (eos == 0) {
		arc.cakeSet("uid", uid);
		arc.cakeSet("sid", sid);
		arc.cakeSet("eos", eos);
		if (arc.DEBUG)
			console.log("- arc: Browser session set");
		return;
	}

	// Store session data according to EOS
	expire = eos * 1000;
	arc.cakeSet("uid", uid, expire);
	arc.cakeSet("sid", sid, expire);
	arc.cakeSet("eos", eos, expire);
	if (arc.DEBUG) {
		var d = new Date(expire);
		console.log("- arc: Session set until", d.toUTCString());
	}
};

/* =============================================================================================
 * API SYSTEM: userSessionDelete
 * Purpose: Delete local session data
 * Parameter(s) N/A
 * Return: N/A
 * --------------------------------------------------------------------------------------------- */
arc.userSessionDelete = function() {
	arc.cakeDel("uid");
	arc.cakeDel("sid");
	arc.cakeDel("eos");
};

/*
 * ___________________________________ PART 4: CONTENT SYSTEM ______________________________________
 */

/* =============================================================================================
 * CONTENT SYSTEM: jQuery
 * Purpose: Define jQuery extension for AuverCloud runtime client
 * Return : N/A
 * --------------------------------------------------------------------------------------------- */
arc.jQuery = function() {

	/* =========================================================================================
	 * JQ METHOD: arcSlideShow
	 * Purpose: Create a picture slideshow defined by params within the container elements.
	 * 			The existing content is maintained. The slideshow is played in background.
	 * 			Supported effects:
	 * 				- fade = fade In / fade Out (default)
	 * 				- slide = Slide down
	 * 				- wipeLeft = Wipe slide left to right
	 * 				- wipeRight = Wipe slide right tot left
	 * 				- pushLeft = Push slide right to left
	 * 				- pushRight = Push slide left to right
	 * 				- pushUp = Push slide bottom to top
	 * 				- pushDown = Push slide top to bottom
	 * Parameter(s):- title = Content title
	 * 				- See param in code below
	 * Return : this
	 * ----------------------------------------------------------------------------------------- */
	$.fn.arcSlideShow = function(param, title) {
		var wrapper = $(this);
		// Extend default parameters
		param = $.extend({}, {
			/* Each slide is defined by {src : "mypicture.jpg", repeat : false}
			 * Where src is the URL of a picture and repeat enable picture repetition (true)
			 * or image rescaling (false) to adjust to the size of the container.
			 * If the slide array contains only a single picture, the picture is simpled displayed as
			 * a background. */
			slides : [],
			// Size: false means no change, otherwise integer value for pixels
			w : 0,
			h : 0,
			// Transition effect
			fx : "fade",
			// Display time in ms
			time : 3000,
			// Number of loop. 0 = forever
			loop : 0,
			// Auto start
			auto : true,
			// Show bullet
			bullet : true,
			// Show handler
			handler : true
		}, param);

		// Prevent too short time
		if (param.time < 1000)
			param.time = 1000;

		// Force size id required
		if (param.w && param.w != 0 && param.w != "0")
			wrapper.width(param.w);
		if (param.h && param.h != 0 && param.h != "0")
			wrapper.height(param.h);

		// Exit if empty slideshow
		if (param.slides.length == 0)
			return this;

		// Set wrapper relative positioning to enable absolute positioning of slides
		// Add CSS properties for slideshow wrapper
		// Add container for list of slides and restore content
		wrapper.css("position", "relative").html("<div class='arc-sc-list'></div><div class='arc-sc-content'></div><div class='arc-sc-bullet'></div><div class='arc-sc-handler'></div><div class='arc-sc-title'></div>");

		// Insert title
		if (title)
			wrapper.children(".arc-sc-title").html(title);
		else
			wrapper.children(".arc-sc-title").css("opacity", 0);

		// Show bullet if required
		if (param.bullet && param.slides.length > 1)
			if (param.bullet && param.slides.length > 1) {
				wrapper.children(".arc-sc-bullet").show().html("<div></div>");
				wrapper.find(".arc-sc-bullet > div").width(20 * param.slides.length);
			}

		// Set handler and bullet position
		var fnSize = function() {
			wrapper.arcSlideHandlerPosition(param.handler, param.slides.length);
			wrapper.children(".arc-sc-bullet").css("top", wrapper.height() - 20);
		};
		fnSize();
		$(window).resize(fnSize);

		// Build picture list
		param.slides.forEach(function(s, i, a) {
			// Backward compatibility
			s.src = s.src.replace("http://", "https://");
			// NB: CSS min-height is useful when the designer forgets to define the height :)
			wrapper.children(".arc-sc-list").append("<div style='min-height:20px;background-image:url(" + s.src + ")'></div>");
			// Adjust size if repeat
			if (s.repeat == true)
				wrapper.find(".arc-sc-list > div:last-child").css("background-repeat", "repeat").css("background-size", "auto");
			// Add bullet if required
			if (param.bullet == true)
				wrapper.find(".arc-sc-bullet > div").append("<div i='" + (i + 1) + "'></div>");
		});

		// Add bullet event if required
		wrapper.find(".arc-sc-bullet > div > div").click(function() {
			// Restart play at required slide
			wrapper.arcSlideReset().arcSlidePlay(0, parseInt($(this).attr("i")));
		});

		// Save slideshow settings in DOM
		wrapper.data("settings", {
			fx : param.fx,
			loop : 0,
			loopMax : param.loop,
			time : param.time,
			len : param.slides.length,
			bullet : param.bullet
		});
		// Show picture (1 slide or not autostart) or start animation
		if (param.slides.length == 1 || !param.auto)
			wrapper.find(".arc-sc-list > div").show();
		else
			wrapper.arcSlidePlay(0, 1);
		return;
	};

	/* =========================================================================================
	 * JQ METHOD: arcSlideHandlerPosition
	 * Purpose: Set slideshow handler position related events
	 * Parameter(s): handler = true/false to show or not
	 * 				 len = slideshow number of slides
	 * Return : this
	 * ----------------------------------------------------------------------------------------- */
	$.fn.arcSlideHandlerPosition = function(handler, len) {
		var wrapper = $(this);
		wrapper.children(".arc-sc-handler").height(wrapper.height() - 20).html("<div>&larr;</div><div>&rarr;</div>");
		wrapper.find(".arc-sc-handler > div").css("top", (wrapper.height() - 80) / 2);
		wrapper.find(".arc-sc-handler > div:last-child").css("left", wrapper.width() - 60);

		// Click left handler
		wrapper.find(".arc-sc-handler > div:first-child").unbind("click").click(function() {
			var settings = wrapper.data("settings");
			wrapper.arcSlideReset();
			if (settings.current == 1)
				wrapper.arcSlidePlay(0, settings.len);
			else
				wrapper.arcSlidePlay(0, settings.current - 1);
		});

		// Click right handler
		wrapper.find(".arc-sc-handler > div:last-child").unbind("click").click(function() {
			var settings = wrapper.data("settings");
			wrapper.arcSlideReset();
			if (settings.current == settings.len)
				wrapper.arcSlidePlay(0, 1);
			else
				wrapper.arcSlidePlay(0, settings.current + 1);
		});

		// Show handlers when hovering
		wrapper.children(".arc-sc-handler").unbind("hover").hover(function() {
			if (handler && len > 1)
				$(this).animate({
					opacity : 1
				}, 500);
			wrapper.children(".arc-sc-title").fadeIn();
		}, function() {
			$(this).animate({
				opacity : 0
			}, 500);
			wrapper.children(".arc-sc-title").fadeOut();
		});
		return this;
	};

	/* =========================================================================================
	 * JQ METHOD: arcSlideReset
	 * Purpose: Reset slideshow
	 * 			Utility called when user interactions using bullets of handlers
	 * Parameter(s): N/A
	 * Return : this
	 * ----------------------------------------------------------------------------------------- */
	$.fn.arcSlideReset = function() {
		// stop Timer
		clearTimeout($(this).data("timer"));
		// Hide all picture and reset their position
		$(this).find(".arc-sc-list > div").hide().css("top", 0).css("left", 0);
		// Reset loop
		var settings = $(this).data("settings");
		settings.loop = 0;
		$(this).data("settings", settings);
		return this;
	};

	/* =========================================================================================
	 * JQ METHOD: arcSlidePlay
	 * Purpose: Display a picture in the context of exiting slideshow (see arcSlideShow)
	 * 			Most settings are transmitted using jQuery data()
	 * Parameter(s): - prev = index of the slide to hide. 0 means no former slide
	 * 				 - next = index of the slide to show.
	 * Return : this
	 * ----------------------------------------------------------------------------------------- */
	$.fn.arcSlidePlay = function(prev, next) {
		var wrapper = $(this);
		// retrieve slideshow settings from DOM
		var settings = wrapper.data("settings");

		// Effect list used for random effect
		var fxList = ["fade", "slide", "wipeRight", "wipeLeft", "pushRight", "pushLeft", "pushUp", "pushDown"];

		// Define function to show the next slide when the current one is displayed
		var showNext = function() {
			// Update slide indexes
			prev = next;
			next = next + 1;
			if (next > settings.len)
				next = 1;

			// Timer saved in DOM (to enable interruption) before playing next slide
			wrapper.data("timer", setTimeout(function() {
				wrapper.arcSlidePlay(prev, next);
			}, settings.time - 1000));
		};
		// Increment loop each time next = 1 then update settings
		if (next == 1)
			settings.loop = settings.loop + 1;

		// Store current slide number
		settings.current = next;
		wrapper.data("settings", settings);

		// Exit if enough loops
		if (settings.loop > settings.loopMax && settings.loopMax != 0)
			return this;

		var prevSlide = wrapper.find(".arc-sc-list > div:nth-child(" + prev + ")");
		var nextSlide = wrapper.find(".arc-sc-list > div:nth-child(" + next + ")");

		// Update bullets if required
		if (settings.bullet) {
			wrapper.find(".arc-sc-bullet > div > div").css("background-color", "#ccc");
			wrapper.find(".arc-sc-bullet > div > div:nth-child(" + next + ")").css("background-color", "#fff");
		}

		// Apply the right fx
		var fxSlide = settings.fx;
		if (settings.fx == "random")
			fxSlide = fxList[Math.floor(Math.random() * (fxList.length - 1))];

		switch(fxSlide) {
		case "fade":
			prevSlide.fadeOut(1000);
			nextSlide.fadeIn(1000, showNext);
			break;
		case "slide":
			prevSlide.fadeOut(1000);
			nextSlide.slideDown(1000, showNext);
			break;
		case "wipeRight":
			nextSlide.css("left", wrapper.width()).show();
			prevSlide.fadeOut(1000);
			nextSlide.animate({
				left : 0
			}, 1000, showNext);
			break;
		case "wipeLeft":
			nextSlide.css("left", -wrapper.width()).show();
			prevSlide.fadeOut(1000);
			nextSlide.animate({
				left : 0
			}, 1000, showNext);
			break;
		case "pushLeft":
			nextSlide.css("left", wrapper.width()).show();
			prevSlide.animate({
				left : -wrapper.width()
			}, 1000, function() {
				prevSlide.css("left", 0).hide();
			});
			nextSlide.animate({
				left : 0
			}, 1000, showNext);
			break;
		case "pushRight":
			nextSlide.css("left", -wrapper.width()).show();
			prevSlide.animate({
				left : wrapper.width()
			}, 1000, function() {
				prevSlide.css("left", 0).hide();
			});
			nextSlide.animate({
				left : 0
			}, 1000, showNext);
			break;
		case "pushUp":
			nextSlide.css("top", wrapper.height()).show();
			prevSlide.animate({
				top : -wrapper.height()
			}, 1000, function() {
				prevSlide.css("top", 0).hide();
			});
			nextSlide.animate({
				top : 0
			}, 1000, showNext);
			break;
		case "pushDown":
			nextSlide.css("top", -wrapper.height()).show();
			prevSlide.animate({
				top : wrapper.height()
			}, 1000, function() {
				prevSlide.css("top", 0).hide();
			});
			nextSlide.animate({
				top : 0
			}, 1000, showNext);
			break;
		default:
			prevSlide.fadeOut(1000);
			nextSlide.fadeIn(1000, showNext);
			break;
		}
		return this;
	};

	/* =========================================================================================
	 * JQ METHOD: arcMenuShow
	 * Purpose: Create menu of links defined by params within the container elements.
	 * Parameter(s): menu = menu data produced by cms.auvercloud editor
	 * Return : this
	 * ----------------------------------------------------------------------------------------- */
	$.fn.arcMenuShow = function(menu) {
		var wrapper = $(this);

		// Build HTML menu
		wrapper.html("<ul class='arc menu'></ul>");
		menu.forEach(function(v) {
			if (v.hasOwnProperty("blank")) {
				var target = target = "_self";
				if (v.blank)
					target = "_blank";
				wrapper.children("ul").append("<li><a href='" + v.url + "' target='" + target + "'>" + v.name + "</a></li>");
			} else {
				wrapper.children("ul").append("<li class='submenu'><span>" + v.name + "</span><ul></ul></li>");
				v.menu.forEach(function(w) {
					var target = target = "_self";
					if (w.blank)
						target = "_blank";
					wrapper.find("ul > li:last-child > ul").append("<li><a href='" + w.url + "' target='" + target + "'>" + w.name + "</a></li>");
				});
			}
		});
		return this;
	};

	/* =========================================================================================
	 * JQ METHOD: arcContent
	 * Purpose: Check content data, get and display it, show error if any
	 * 			NB: API method is GET in order to simplify access using other means
	 * Parameter(s): 	- ctype = content type
	 * 					- callback = Function called when content has been loaded
	 * 				 	- error = Function called on Ajax error
	 * Return : this
	 * ----------------------------------------------------------------------------------------- */
	$.fn.arcContent = function(ctype, callback, error) {
		var box = $(this);
		var cname = box.attr(arc.DOM_PREFIX + "-" + ctype);
		var html = "";
		var cdate = "0000-00-00 00:00:00";

		// By default, load the latest version except when date attribute is set
		if ( typeof box.attr(arc.DOM_PREFIX + "-date") != "undefined")
			cdate = box.attr(arc.DOM_PREFIX + "-date");

		// By default, use the current key except a key is defined
		var keyContent = arc.APP_KEY;
		if ( typeof box.attr(arc.DOM_PREFIX + "-key") != "undefined")
			keyContent = box.attr(arc.DOM_PREFIX + "-key");

		arc.api("content_pub", {
			key : keyContent,
			cname : cname,
			ctype : ctype,
			cdate : cdate
		}, function(o) {
			// Display error if any
			if (o.code != "200") {
				var html = "<h1 style='color:white'>Error " + o.code + ": " + o.msg + "</h1>";
				var bg = "#f00";
				box.html(html).css("background-color", bg).addClass("arc-style-normal");
			} else {
				switch (ctype) {
				case "frame":
					box.html("<div class='arc-title'>" + o.data[2] + "</div><iframe src='" + o.data[0] + "' class='arc-frame'></iframe>");
					break;
				case "menu":
					box.arcMenuShow(JSON.parse(o.data[0]));
					break;
				case "picture":
					box.arcSlideShow(JSON.parse(o.data[0]), o.data[2]);
					break;
				case "text":
					var html = o.data[0];
					var bg = o.data[1];
					if (cdate == "0000-00-00 00:00:00")
						cdate = "";
					box.html("<div class='arc-date'>" + cdate + "</div><div class='arc-title'>" + o.data[2] + "</div>" + html).css("background-color", bg).addClass("arc-style-normal");
					break;
				}
			}

			// Success callback
			if ( typeof callback == "function")
				callback();

			if (arc.DEBUG)
				console.log("- arc:", ctype, cname, "loaded");
		}, function() {
			box.html("<h1 style='background:red;color:white'>Connection error. Please retry later</h1>");

			// Error callback
			if ( typeof error == "function")
				error();
			if (arc.DEBUG)
				console.log("- arc:", ctype, cname, "loading failed");

		}, "get");
		return this;
	};

	/* =========================================================================================
	 * JQ METHOD: arcLog
	 * Purpose: Get the list of archived version for a specific text content
	 * Parameter(s):- callback = Function called when content has been loaded
	 * 				- error = Function called on Ajax error * Return : this
	 * Return : this
	 * ----------------------------------------------------------------------------------------- */
	$.fn.arcLog = function(callback, error) {
		var box = $(this);
		var cname = box.attr(arc.DOM_PREFIX + "-log");
		var html = "";

		// Clear content
		box.html(html);

		// Get log from server
		arc.api("content_log", {
			cname : cname
		}, function(o) {

			// Display error if any
			if (o.code != "200") {
				var html = "<h1 style='color:white'>Error " + o.code + ": " + o.msg + "</h1>";
				var bg = "#f00";
				box.html(html).css("background-color", bg).addClass("arc-style-normal");
			} else {

				// Latest post
				latestItem = o.data.shift();
				box.append("<div class='arc-log-latest' id='0000-00-00 00:00:00' arc-name='" + latestItem[0] + "'>" + latestItem[1] + "</div>");

				// Build month lists content texts
				var month = "";
				o.data.forEach(function(i) {
					var thisMonth = i[3].substr(0, 7);
					if (thisMonth != month) {
						month = thisMonth;
						box.append("<ul class='arc-log'><div><span>+</span>" + month + "</div></ul>");
					}
					if (i[1] != "")
						box.children("ul:last-child").append("<li id='" + i[3] + "' arc-name='" + i[0] + "'>" + i[1] + "</li>");
				});

				// Display the number of items per month
				box.find("ul > div").each(function() {
					var len = $(this).siblings("li").length;
					$(this).append(" (" + len + ")");
				});

				// Event : Click to toggle month view
				box.find("ul > div").click(function() {
					$(this).siblings("li").slideToggle();
					if ($(this).children("span").html() == "- ")
						$(this).children("span").html("+ ");
					else
						$(this).children("span").html("- ");
				});

				// Event: Click to update the viewed content text
				box.find("li, .arc-log-latest").click(function() {
					var cname = $(this).attr(arc.DOM_PREFIX + "-name");
					var cdate = $(this).attr("id");
					$("div[" + arc.DOM_PREFIX + "-text='" + cname + "']").attr(arc.DOM_PREFIX + "-date", cdate).arcContent("text");

				});

				// Maximize the latest month list
				box.find(".arc-log:first div").trigger("click");

				// Success callback
				if ( typeof callback == "function")
					callback();

				if (arc.DEBUG)
					console.log("- arc:", cname, "loaded");
			}
		}, function() {
			// Connection error
			box.html("<h1 style='background:red;color:white'>Connection error. Please retry later</h1>");

			// Error callback
			if ( typeof error == "function")
				error();
			if (arc.DEBUG)
				console.log("- arc:", cname, "loading failed");

		}, "get");
		return this;
	};
};

/* =============================================================================================
 * CONTENT SYSTEM: run
 * Purpose: start AuverCloud client and load required content
 * Parameter(s): key = Application key
 * 				 options = See details below
 * Return : N/A
 * --------------------------------------------------------------------------------------------- */
arc.run = function(key, options) {

	// Default settings
	var settings = $.extend({
		// Debug mode
		debug : false,
		// API wait UI
		api_wait : false,
		// Supported languages
		languages : ["en"],
		// Callback function
		callback : false
	}, options);

	// Apply options
	arc.DEBUG = settings.debug;
	arc.API_WAIT = settings.api_wait;
	arc.APP_LANGUAGE_SUPPORTED = settings.languages;

	// Check key API
	if (!key) {
		if (arc.DEBUG)
			console.log("- arc: Application key is missing");
		return;
	} else
		arc.APP_KEY = key;

	// Exit if already loaded
	if ($("body").data(arc.DOM_PREFIX + "Loaded")) {
		// Callback
		if ( typeof settings.callback == "function")
			settings.callback();
		return;
	}

	// Set flag
	$("body").data(arc.DOM_PREFIX + "Loaded", true);

	// Define jQuery extensions
	arc.jQuery();

	// Update body to take care of iOS touch behavior
	$("body").attr("ontouchstart", "").attr("onmouseover", "");

	// Get content
	var contents = ["text", "picture", "menu", "frame"];
	var num = {};
	contents.forEach(function(ctype) {
		num[ctype] = 0;
		$("[" + arc.DOM_PREFIX + "-" + ctype + "]").each(function() {
			num[ctype] = num[ctype] + 1;
			$(this).arcContent(ctype);
		});
	});

	// Get log
	num.log = 0;
	$("[" + arc.DOM_PREFIX + "-log]").each(function() {
		$(this).arcLog();
		num.log = num.log + 1;
	});
	// Add interaction to log when loaded from PHP
	$("." + arc.DOM_PREFIX + "-log-php").each(function() {
		// Display the number of log items per month
		$(this).find("ul > div").each(function() {
			var len = $(this).siblings("li").length;
			$(this).append(" (" + len + ")");
		});

		// Enable maximize/minimize view for each month of the log section
		$(this).find("ul > div").click(function() {
			$(this).siblings("li").slideToggle();
			if ($(this).find("a span").html() == "- ")
				$(this).find("a span").html("+ ");
			else
				$(this).find("a span").html("- ");
		});

		// Maximize the latest month log
		$(this).find("ul:first > div").trigger("click");
	});

	// Log page load
	arc.api("utility_page_log");

	// Console summary
	if (arc.DEBUG) {
		console.log("- arc:", num.text, "text(s)");
		console.log("- arc:", num.picture, "picture(s)");
		console.log("- arc:", num.menu, "menu(s)");
		console.log("- arc:", num.frame, "frame(s)");
		console.log("- arc:", num.log, "log(s)");
	}

	// Callback
	if ( typeof settings.callback == "function")
		settings.callback();
};

/* =============================================================================================
 * Load AuverCloud runtime CSS
 * ============================================================================================= */
arc.getCSS("arcCSS", arc.CLIENT_CSS);
/* =============================================================================================
 * EoF
 * ============================================================================================= */
