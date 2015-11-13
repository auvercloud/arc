/* =============================================================================================
 * AUVERCLOUD RUNTIME CLIENT (arc)
 * =============================================================================================
 * AUTHOR: guillaume@auvercloud.fr
 * VERSION: 3.0
 * =============================================================================================
 * JAVASCRIPT DEPENDENCE
 * 		- jQuery 2.x (http://jquery.com/download/)
 * =============================================================================================
 * CSS DEPENDENCE
 * https://www.auvercloud.com/run/css/arc.css is required when
 * AuverCloud runtime client is used for AuverCloud cross-domain API client and content publishing
 * =============================================================================================
 * BROWSER SUPPORT
 * 		- IE >= 9
 * 		- Firefox >= 30
 * 		- Chrome >= 30
 * 		- Safari >= 7
 * 		- Opera >= 30
 * 		- Mobile Safari >= 8
 * 		- Android Browser >= 4
 * 		- Chrome for Android >= 42
 * 		- Opera mini: Not supported
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
 * =============================================================================================
 * List of ARC methods required as AuverCloud API client:
 *
 * 		arc.cake = Similar to cookies but based on local and session storage
 * 			- arc.cake.test()
 * 			- arc.cake.erase(key)
 * 			- arc.cake.write(key, value, options)
 * 			- arc.cake.read(key)
 * 		arc.device = Return and set information about current device for tracking and localization
 * 			- arc.device.os()
 * 			- arc.device.browser()
 * 			- arc.device.type()
 *			- arc.device.fingerprint()
 * 			- arc.device.lang(lang)
 * 		arc.api = Cross domain REST API client based on jQuery $.ajax
 * 		arc.run = AuverCloud client initialization (API + AuverCloud content loading and rendering)
 *
 * jQuery plugin:
 * 		slideshow = AuverCloud slideshow animation and user events
 *
 * ============================================================================================= */
var arc = {
	/* ---------------------------------------------------------------------------------------------
	 * GLOBAL VARIABLES
	 */

	DEBUG : false && window.console,

	// APPLICATION KEY: MUST BE SET WITH A VALID KEY FOR ANY API CALL
	APP_KEY : "",

	// APPLICATION NAME: Used in cakes (see below). Optional
	APP_NAME : "",

	// API SERVER URL: SHOULD NOT BE MODIFIED
	API_URL : "https://api.auvercloud.com/",

	// DOM attribute content prefix e.g. prefix-text, prefix-log...
	DOM_PREFIX : "arc",

	// Width threshold between small and large devices (in pixels)
	SMARTPHONE_MAX_WIDTH : 600,

	// Pseudo-infinite time in ms
	FOREVER : 9876543210000,

	/* ---------------------------------------------------------------------------------------------
	 * UTILITY: cake.___
	 * Purpose: A kind of cookie based on local and session storage.
	 * Properties:	- Expiration time (ms)
	 */
	cake : {
		// Test the support of both session and local storage. Return true or false.
		test : function() {

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
		},

		/* ---------------------------------------------------------------------------------------------
		 * Purpose: Erase 'cake' value in both session and local storages
		 * Parameter(s): - key = Cake name (string)
		 * 				 - options
		 * 						key = AuverCloud application key. Default is global variable arc.APP_KEY
		 * 						app = Additional application name. Default is global variable arc.APP_NAME
		 * Return : value
		 */
		erase : function(key, options) {

			options = $.extend({
				// Default application key
				key : arc.APP_KEY,
				// Default application name
				app : arc.APP_NAME
			}, options);

			key = options.key + "_" + options.app + "_" + key;
			sessionStorage.removeItem(key);
			localStorage.removeItem(key);
			return true;

		},

		/* ---------------------------------------------------------------------------------------------
		 * Purpose: Write a cake in local or session storage depending on parameter
		 * Parameter(s): - key = Cake name (string)
		 *               - value = Cake value (any object)
		 * 				 - options
		 * 						expire = Expiration time in ms. Default is pseudo-infinite (never expire)
		 * 								 0 to expire with browser session.
		 * 						key = AuverCloud application key. Default is global variable arc.APP_KEY
		 * 						app = Additional application name. Default is global variable arc.APP_NAME
		 * Return : value
		 */
		write : function(key, value, options) {

			options = $.extend({
				// Default time: Pseudo-infinite time in ms
				expire : 9876543210000,
				// Default application key
				key : arc.APP_KEY,
				// Default application name
				app : arc.APP_NAME
			}, options);

			key = options.key + "_" + options.app + "_" + key;

			if (options.expire > 0)
				// Store in localStorage
				localStorage.setItem(key, JSON.stringify({
					body : value,
					expire : options.expire
				}));
			else
				// Store in sessionStorage
				sessionStorage.setItem(key, JSON.stringify(value));

			return value;
		},

		/* ---------------------------------------------------------------------------------------------
		 * Purpose: Read cake value
		 * Parameter(s): - key = cake name (string)
		 * 				 - options
		 * 						key = AuverCloud application key. Default is global variable arc.APP_KEY
		 * 						app = Additional application name. Default is global variable arc.APP_NAME
		 * Return: value (success) / false (failure)
		 */
		read : function(key, options) {

			options = $.extend({
				// Default application key
				key : arc.APP_KEY,
				// Default application name
				app : arc.APP_NAME
			}, options);

			key = options.key + "_" + options.app + "_" + key;

			// Try to get value(s) from session first
			var cake = sessionStorage.getItem(key);
			if (cake) {
				// Return the value
				return JSON.parse(cake);
			} else {
				// Try local storage if no session storage
				cake = localStorage.getItem(key);
				if (cake) {
					cake = JSON.parse(cake);
					if (cake.expire > new Date().getTime()) {
						// cake is still fresh
						return cake.body;
					} else {
						// cake is too old, it is time to delete it
						localStorage.removeItem(key);
						return false;
					}
				} else {
					// No local storage cake
					return false;
				}
			}
		}
	},

	/* ---------------------------------------------------------------------------------------------
	 * UTILITY: device.___
	 * Purpose: Return info about the current device
	 */
	device : {
		// Operating System: windows, osx, linux, android, ios, wphone, other
		os : function() {
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
		},

		// Browser: chrome, firefox, safari, msie, opera, silk, mchrome, msafari
		browser : function() {
			var ua = navigator.userAgent.toLowerCase();
			if (ua.indexOf("edge") != -1)
				return "edge";
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
		},

		// Type: smartphone, tablet, computer, other
		type : function() {
			var os = arc.device.os();
			if ($(window).width() < arc.SMARTPHONE_MAX_WIDTH && (os == "android" || os == "ios" || os == "wphone"))
				return "smartphone";
			if (os == "android" || os == "ios" || os == "wphone")
				return "tablet";
			if (os == "windows" || os == "osx" || os == "linux")
				return "computer";
			return "other";
		},

		/* ---------------------------------------------------------------------------------
		 * Check if an app related fingerprint is stored locally and return it.
		 * Otherwise, generate a new fingerprint, store it locally and return it.
		 * Return: unique ID (string 32)
		 */
		fingerprint : function() {
			var fingerprint = arc.cake.read("fingerprint");

			// Existing fingerprint
			if (fingerprint)
				return fingerprint;

			// Otherwise new fingerprint
			var d = new Date().getTime();
			fingerprint = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = (d + Math.random() * 16) % 16 | 0;
				d = Math.floor(d / 16);
				return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
			});
			arc.cake.write("fingerprint", fingerprint);
			return fingerprint;
		},

		/* ---------------------------------------------------------------------------------
		 * Return or set language to apply for the current device. Various methods available:
		 * 		1. Set parameter e.g. "fr", "en" to force value
		 * 		2. Existing language 'cake'
		 * 		3. existing HTML attribute
		 * 		4. Navigatorlanguage
		 */

		lang : function(lang) {

			// If no parameter get other source
			if (!lang) {
				// Get cake if any
				var cakeLang = arc.cake.read("lang");

				if (cakeLang) {
					lang = cakeLang;
				} else {
					var htmlLang = $("html").attr("lang");
					if (htmlLang)
						lang = htmlLang;
					else
						// Default browser language
						lang = (window.navigator.userLanguage || window.navigator.language).substr(0, 2).toLowerCase();
				}
			}
			// Persistent cake
			arc.cake.write("lang", lang);

			return lang;
		}
	},

	/* ---------------------------------------------------------------------------------------------
	 * CROSS DOMAIN API CLIENT: api
	 * Purpose: Single entry point AuverCloud API server from any domain (CORS)
	 * 			Require global variables arc.APP_KEY and arc.API_URL
	 * 			Add device data for tracking
	 * Parameter(s): - params 	= JSON object of call parameters. It must contain at least
	 * 				 - options 	= Call options. See detail below
	 * Return: 	N/A
	 */
	api : function(params, options) {
		params = $.extend({
			// Default application key inherited from global variables
			key : arc.APP_KEY,

			// Default API: version => Return the API server version
			api : "version",

			// Device info
			deviceOS : arc.device.os(),
			deviceType : arc.device.type(),
			deviceBrowser : arc.device.browser(),
		}, params);

		options = $.extend({
			// Default API server URL inherited from global variables
			url : arc.API_URL,

			// Default method: POST
			method : "post",

			// Default success callback: Message in console
			success : function(data) {
				if (arc.DEBUG)
					console.log("- arc: Default success callback to", params.api, "=", data);
			},

			// Default error callback: Alert
			error : function(jqXHR, textStatus, errorThrown) {
				console.log("Network error. Please retry later:", textStatus, errorThrown);
			},

			// Default upload progress (between 0.0 and 1.0) callback: Message in console
			up : function(progress) {
				if (arc.DEBUG)
					console.log("- arc: Default API progress Up", progress);
			},

			// Default download progress (between 0.0 and 1.0) callback: Message in console
			down : function(progress) {
				if (arc.DEBUG)
					console.log("- arc: Default API progress Down", progress);
			},
			// Session flag. If set, add the AuverCloud session local parameters
			session : false
		}, options);

		// Add session parameters if required
		if (options.session)
			$.extend(params, {
				// Unique User ID
				uuid : arc.cake.read("uuid"),
				// Unique Session ID
				usid : arc.cake.read("usid"),
				// End of Session Time (in ms)
				eost : arc.cake.read("eost"),
				// Unique Device ID
				udid : arc.device.fingerprint()
			});

		// Catch API error
		try {
			$.ajax({
				xhr : function() {
					var xhr = new window.XMLHttpRequest();

					//Upload progress
					xhr.upload.addEventListener("progress", function(e) {
						if (e.lengthComputable)
							options.up(e.loaded / e.total);
					}, false);

					//Download progress
					xhr.addEventListener("progress", function(e) {
						if (e.lengthComputable) {
							options.down(e.loaded / e.total);
						}
					}, false);
					return xhr;
				},
				url : options.url,
				type : options.method,
				dataType : "json",
				data : params,
				success : function(o) {
					options.success(o);
					if (arc.DEBUG)
						console.log("- arc: API response", params.api, "===>", o);
				},
				error : function(o) {
					options.error(o);
					if (arc.DEBUG)
						console.log("- arc: API failure", params.api, "===>", o);
				}
			});

			// Success console and result
			if (arc.DEBUG)
				console.log("- arc:", options.method + ":", params);
			return true;
		} catch(e) {

			// Error console and result
			if (arc.DEBUG)
				console.log("- arc:", options.method, "=> Error", e);
			return false;
		}
	},
	/* ---------------------------------------------------------------------------------------------
	 * SESSION MANAGEMENT: sessionStore
	 * Purpose: Store session parameters returned by the API 'signin'
	 * Parameter(s): - params 	= session parameters
	 * 				 - options 	= application key and name. See code below.
	 * Return: 	N/A
	 */
	sessionStore : function(parameters, options) {
		options = $.extend({
			// Default application key
			key : arc.APP_KEY,
			// Default application name
			app : arc.APP_NAME,
			// Expiration time is set with session parameters
			expire : parameters.eost * 1000
		}, options);

		// Clear former cakes to prevent collision between session and local storages
		arc.cake.erase("uuid", options);
		arc.cake.erase("usid", options);
		arc.cake.erase("udid", options);
		arc.cake.erase("eost", options);

		// Store parameters with the right expiration time
		arc.cake.write("uuid", parameters.uuid, options);
		arc.cake.write("usid", parameters.usid, options);
		arc.cake.write("udid", parameters.udid, options);
		arc.cake.write("eost", parameters.eost, options);

		if (arc.DEBUG) {
			var d = new Date(parameters.eost * 1000);
			console.log("- arc: Session set until", d.toUTCString());
		}

	},
	/* ---------------------------------------------------------------------------------------------
	 * AuverCloud runtime client initialization
	 * Purpose:	- Init API settings
	 * 			- Check application key
	 * 			- Load content for HTML elements that contain AuverCloud attribute:
	 * 				- arc-text,
	 * 				- arc-picture,
	 * 				- arc-menu,
	 * 				- arc-log
	 * 			- Start slideshow animation (option)
	 * Parameter(s): key = Application key
	 * 				 options = See details below
	 * Return : N/A
	 */
	run : function(key, options) {

		// Default settings
		var settings = $.extend({
			// Application name: Used as namespace for localstorage
			name : "",
			// Debug mode: Display or not console message related to API calls
			debug : false,
			// Slideshow animation: Start or not the animation for all Auvercloud slideshow content
			slideshow : true,
			// Callback: Function called when all the contents have been loaded
			callback : false
		}, options);

		// Apply options
		arc.APP_NAME = settings.name;
		arc.DEBUG = settings.debug;

		// Check key API
		if (!key) {
			if (arc.DEBUG)
				console.log("- arc: Application key is missing");
			return;
		} else
			arc.APP_KEY = key;

		// Init content loading
		var contents = ["text", "picture", "menu"];
		var num = {
			text : 0,
			picture : 0,
			menu : 0,
			log : 0
		};
		var contentSum = 0;
		var contentCount = 0;
		var contentFlag = false;

		// Called when all contents are loaded to apply UI methods and run callback
		var finalize = function() {

			if (arc.DEBUG)
				console.log("- arc: Finalize content UI");

			if (settings.slideshow)
				$(".arc-sc").slideshow();

			if ( typeof settings.callback == "function")
				settings.callback();
		};

		// Call function applied after each content load to check if all contents are loaded
		var callback = function() {

			contentCount = contentCount + 1;
			var remain = contentSum - contentCount;

			if (arc.DEBUG)
				console.log("- arc: Content(s) to load", remain);

			// Finalize when the last content has been loaded
			if (contentFlag && remain < 1)
				finalize();

		};

		// Load contents: text, picture, menu
		contents.forEach(function(ctype) {
			num[ctype] = 0;
			$("[" + arc.DOM_PREFIX + "-" + ctype + "]").each(function() {

				// Increment type related counter
				num[ctype] = num[ctype] + 1;

				// Init content download
				var container = $(this);
				var cname = container.attr(arc.DOM_PREFIX + "-" + ctype);
				container.removeAttr(arc.DOM_PREFIX + "-" + ctype);

				arc.api({
					api : "content_pub",
					cname : cname,
					ctype : ctype,
					output : "json"
				}, {
					method : "get",
					// Connection failure
					error : function() {
						container.html("<h1 style='background:red;color:white'>Connection error. Please retry later</h1>");
						if (arc.DEBUG)
							console.log("- arc:", ctype, cname, "loading failed");
					},
					// Response
					success : function(o) {

						// Display error if any
						if (o.code != "200") {
							container.html("<h1 style='color:white'>Error " + o.code + ": " + o.msg + "</h1>").css("background-color", "#f00").addClass("arc-style-normal");
							return;
						};

						// Display content
						container.html(o.data);
						if (arc.DEBUG)
							console.log("- arc:", ctype, cname, "loaded");

						// Run callback
						callback();
					}
				});

			});
		});

		// Load logs
		$("[" + arc.DOM_PREFIX + "-log]").each(function() {

			// Increment log related counter
			num.log = num.log + 1;

			// Init log download
			var container = $(this);
			var cname = container.attr(arc.DOM_PREFIX + "-log");
			container.removeAttr(arc.DOM_PREFIX + "-log");

			arc.api({
				api : "content_log",
				cname : cname,
				output : "json"
			}, {
				method : "get",
				// Connection failure
				error : function() {
					box.html("<h1 style='background:red;color:white'>Connection error. Please retry later</h1>");
					if (arc.DEBUG)
						console.log("- arc:", ctype, cname, "loading failed");
				},
				// Response
				success : function(o) {

					// Display error if any
					if (o.code != "200") {
						container.html("<h1 style='color:white'>Error " + o.code + ": " + o.msg + "</h1>").css("background-color", "#f00").addClass("arc-style-normal");
						return;
					};

					// Display content
					container.html(o.data);

					// Event : Toggle month view
					container.find(".arc-log > div > span").click(function() {
						$(this).parent().siblings("li").slideToggle();
						if ($(this).html() == "-")
							$(this).html("+");
						else
							$(this).html("-");
					});

					if (arc.DEBUG)
						console.log("- arc:", "log", cname, "loaded");

					// Run callback
					callback();
				}
			});
		});

		contentFlag = true;
		contentSum = num.text + num.picture + num.menu + num.log;

		// Stop when no content
		if (contentSum == 0)
			finalize();

		// Console summary
		if (arc.DEBUG) {
			console.log("- arc:", num.text, "text(s)");
			console.log("- arc:", num.picture, "picture(s)");
			console.log("- arc:", num.menu, "menu(s)");
			console.log("- arc:", num.log, "log(s)");
		}
	}
}; ( function() {

		/* =============================================================================================
		 * JQUERY EXTENSION: slideshow
		 * Purpose: Slideshow animation and user interface events for AuverCloud picture/slideshow content
		 * Parameter(s): 	- options
		 * Return : N/A
		 * --------------------------------------------------------------------------------------------- */

		$.fn.slideshow = function(options) {

			// Default settings
			var settings = $.extend({
				// Prevent animation when set. Useful for smartphone adaptative UI.
				no_anim : false,
			}, options);

			var container = $(this);

			// Animation fx
			var fx = container.data("arc-fx");

			// Display time in ms
			var time = container.data("arc-time");

			// Max. loop. 0 = infinite loop
			var max = container.data("arc-loop");

			// Current loop
			var loop = 0;

			// Current slide
			var current = 0;

			// Slideshow length
			var len = container.find(".arc-sc-list > div").length;

			// Effect list used for random effect
			var listFX = ["fade", "slide", "wipeRight", "wipeLeft", "pushRight", "pushLeft", "pushUp", "pushDown"];

			// Update bullet UI depending on current slide
			var bullet = function(n) {
				container.find(".arc-sc-bullet > div > div").removeClass("arc-sc-bullet-active").addClass("arc-sc-bullet-idle");
				container.find(".arc-sc-bullet > div > div:nth-child(" + n + ")").removeClass("arc-sc-bullet-idle").addClass("arc-sc-bullet-active");
			};

			// Define handler event for manual mode
			container.find(".arc-sc-handler > div > div").unbind("click").click(function() {

				// Define the required slide according to event
				if ($(this).hasClass("arc-handler-left")) {
					current = current - 1;
					if (current < 0)
						current = len - 1;
				} else {
					current = current + 1;
					if (current >= len)
						current = 0;
				}

				// Stop timer
				var timer = container.data("timer");
				clearTimeout(timer);

				// Clear picture and animation
				container.find(".arc-sc-list > div").hide().css("top", 0).css("left", 0).finish();

				// Show the slide and update bullet
				container.find(".arc-sc-list > div:nth-child(" + (current + 1) + ")").show();
				bullet(current + 1);

			});

			var slidePlay = function(prev, next) {

				// Update slide indexes
				current = next;
				prev = next;
				next = next + 1;

				if (next > len) {
					next = 1;
					loop = loop + 1;
				}

				// Stop show if max
				if (max != 0 && loop > max)
					return;

				// Select the right pictures
				var slidePrev = container.find(".arc-sc-list > div:nth-child(" + prev + ")");
				var slideNext = container.find(".arc-sc-list > div:nth-child(" + next + ")");

				// Update bullets
				bullet(next);

				// Apply the right fx
				var fxSlide = fx;
				if (fx == "random")
					fxSlide = listFX[Math.floor(Math.random() * (listFX.length - 1))];

				switch(fxSlide) {
				case "fade":
					slidePrev.fadeOut(1000);
					slideNext.fadeIn(1000);
					break;
				case "slide":
					slidePrev.fadeOut(1000);
					slideNext.slideDown(1000);
					break;
				case "wipeRight":
					slideNext.css("left", container.width()).show();
					slidePrev.fadeOut(1000);
					slideNext.animate({
						left : 0
					}, 1000);
					break;
				case "wipeLeft":
					slideNext.css("left", -container.width()).show();
					slidePrev.fadeOut(1000);
					slideNext.animate({
						left : 0
					}, 1000);
					break;
				case "pushLeft":
					slideNext.css("left", container.width()).show();
					slidePrev.animate({
						left : -container.width()
					}, 1000, function() {
						slidePrev.css("left", 0).hide();
					});
					slideNext.animate({
						left : 0
					}, 1000);
					break;
				case "pushRight":
					slideNext.css("left", -container.width()).show();
					slidePrev.animate({
						left : container.width()
					}, 1000, function() {
						slidePrev.css("left", 0).hide();
					});
					slideNext.animate({
						left : 0
					}, 1000);
					break;
				case "pushUp":
					slideNext.css("top", container.height()).show();
					slidePrev.animate({
						top : -container.height()
					}, 1000, function() {
						slidePrev.css("top", 0).hide();
					});
					slideNext.animate({
						top : 0
					}, 1000);
					break;
				case "pushDown":
					slideNext.css("top", -container.height()).show();
					slidePrev.animate({
						top : container.height()
					}, 1000, function() {
						slidePrev.css("top", 0).hide();
					});
					slideNext.animate({
						top : 0
					}, 1000);
					break;
				default:
					slidePrev.fadeOut(1000);
					slideNext.fadeIn(1000);
					break;
				}

				// Timer saved in DOM (to enable interruption) before playing next slide
				container.data("timer", setTimeout(function() {
					slidePlay(prev, next);
				}, time - 1000));

			};

			// Start slideshow
			container.find(".arc-sc-list > div").hide();
			container.find(".arc-sc-list > div:first-child").show();
			container.find(".arc-sc-bullet > div > div").removeClass("arc-sc-bullet-active").addClass("arc-sc-bullet-idle");
			container.find(".arc-sc-bullet > div > div:first-child").removeClass("arc-sc-bullet-idle").addClass("arc-sc-bullet-active");

			// Animate if more than 1 slide and no_anim not set
			if (len < 2 || settings.no_anim)
				return;

			container.data("timer", setTimeout(function() {
				slidePlay(0, 1);
			}, time - 1000));

		};
	}(jQuery));
/* =============================================================================================
 * EoF
 * ============================================================================================= */
