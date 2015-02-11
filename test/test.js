/* *************************************************************************************************
 * Function: keyStart
 * Purpose: Init UI depending on application key
 * Return: N/A
 */
function keyStart() {
	arc.run($("#app-key").val(), {
		debug : true,
		callback : function() {

			// Init session UI according to current session status
			var requestSent = arc.apiSession("user_session_check", {}, function(o) {
				if (o.code == 200) {

					// Set session UI
					$(".session > div").removeClass("led-red").addClass("led-green");
					$(".session > span").html("on");
				} else {

					// Clear session UI
					$(".session > div").removeClass("led-green").addClass("led-red");
					$(".session > span").html("off");
				}
			});

			// Reset session UI if session checking fails
			if (!requestSent) {
				// Clear local session data
				arc.userSessionDelete();

				// Clear session UI
				$(".session > div").removeClass("led-green").addClass("led-red");
				$(".session > span").html("off");

			}

			// Init Captcha-like pictures
			arc.api("utility_capcha_new", {}, function(data) {
				// Set IMG and save related token in IMG DOM using jQuery data
				$("#capcha").attr("src", arc.CAPCHA_PATH + data.data.token + ".png").data("token", data.data.token);
			});
			arc.api("utility_capcha_new", {}, function(data) {
				$("#url-capcha").attr("src", arc.CAPCHA_PATH + data.data.token + ".png").data("token", data.data.token);
			});
			arc.api("utility_capcha_new", {}, function(data) {
				$("#subscriber-capcha").attr("src", arc.CAPCHA_PATH + data.data.token + ".png").data("token", data.data.token);
			});
			arc.api("utility_capcha_new", {}, function(data) {
				$("#password-capcha").attr("src", arc.CAPCHA_PATH + data.data.token + ".png").data("token", data.data.token);
			});
		}
	});
}

/* *************************************************************************************************
 * jQuery Start
 */
$(function() {
	arc.DEBUG = true;
	// load jQuery generic UI utilities
	plugin();

	// Event: Side menu event
	$("#test-menu ul ul li").click(function() {
		api = $(this).html().trim();
		$("html, body").animate({
			scrollTop : $("h3:contains('" + api + "')").offset().top - $("header").height()
		}, 200);
	});

	// Event: Scroll to top when clicking title
	$("h3 > span:first-child").click(function() {
		$("html, body").animate({
			scrollTop : 0
		}, 200);
	});

	// Event: Application key change
	$("#app-key").keyup(function() {
		var key = $("#app-key").val();
		if (key && key.length == 45)
			keyStart();
	});

	// Title for tooltip about API reference guide
	$("section .tooltip").attr("title", "Reference Manual");
	// Init tooltip
	$(".tooltip").tooltipster({
		animation : 'grow',
		delay : 600,
		contentAsHTML : true
	});

	// UI utility
	$.fn.arcResponse = function(o) {
		var res = o.code + " " + o.msg;
		$(this).hide();
		if (o.code == "200")
			$(this).css("color", "green");
		else {
			res = res + "<span style='font-family:Courier;color:#A00'>" + o.data.substr(45) + "</span>";
			$(this).css("color", "red");
		}
		$(this).html(res).fadeIn();
	};

	// Start depending on URL parameters
	var param = arc.urlParameters();

	// Select menu name depending on language parameter
	if (param.key && param.key.length == 45) {
		$("#app-key").val(param.key);
		keyStart();
	} else {
		// Load runtime jQuery method in any case
		arc.jQuery();
		$("body").data(arc.DOM_PREFIX + "Loaded", true);
	}

	// Choose language depending on parameters
	var lang = "en";
	if (["en", "fr"].indexOf(param.lang) != -1)
		lang = param.lang;

	// Load the right head menu whatever the application key and language
	arc.api("content_pub", {
		key : "8065d07da4a77621450aa84fee5656d953e9c89b7ec85",
		cname : "com_" + lang + "_menu",
		ctype : "menu"
	}, function(o) {
		if (o.code == "200")
			$("#head-menu").arcMenuShow(JSON.parse(o.data[0]));

	}, false, "get");

	// Init social networks bar
	snb({
		lang : lang,
		hashtag : "auvercloud"
	});

	// Init language buttons
	$(".lang-btn").click(function() {
		var newLang = $(this).attr("id").substr(5, 2);
		location.replace("index.html?lang=" + newLang + "&key=" + arc.APP_KEY);
	});

	// *********************************************************************************************
	// API utility_capcha_new, utility_capcha_check
	// *********************************************************************************************

	// Token parameter set to current token to burn it before getting a new one
	// Other default values are applied: Simple text, 30 pixels height, random color
	$("#capcha-refresh").click(function() {
		arc.api("utility_capcha_new", {
			token : $("#capcha").data("token")
		}, function(data) {
			$("#capcha").attr("src", arc.CAPCHA_PATH + data.data.token + ".png").data("token", data.data.token);
		});
	});

	// API utility_capcha_check
	$("#capcha-check").click(function() {
		arc.api("utility_capcha_check", {
			token : $("#capcha").data("token"),
			data : $("#capcha-input").val(),
		}, function(o) {
			$("#capcha-response").arcResponse(o);
		});
	});

	// *********************************************************************************************
	// API utility_contact
	// *********************************************************************************************
	$("#contact-send").click(function() {

		// Mandatory parameters
		var params = {
			email_business : $("#email-business").val(),
			contact_subject : $("#contact-subject").val(),
			contact_body : $("#contact-body").val()
		};

		// Optional parameters
		if ($("#email-visitor").val() != "") {
			params.email_visitor = $("#email-visitor").val();
			params.ack_subject = $("#ack-subject").val();
			params.ack_body = $("#ack-body").val();
		}

		arc.api("utility_contact", params, function(o) {
			$("#contact-response").arcResponse(o);
		});
	});

	// *********************************************************************************************
	// API utility_ip, utility_ip2country
	// *********************************************************************************************

	// Get current IP and init input with it
	$("#utility-ip").click(function() {
		arc.api("utility_ip", {}, function(o) {
			$("#utility-ip-response").arcResponse(o);
			if (o.code == 200)
				$("#utility-ip-value").val(o.data.ip);
		});
	});

	// Get country from IP
	$("#utility-country").click(function() {
		arc.api("utility_ip2country", {
			ip : $("#utility-ip-value").val()
		}, function(o) {
			$("#utility-country-response").arcResponse(o);
			if (o.code == 200)
				$("#utility-country-value").html(o.data.country);
			else
				$("#utility-country-value").html("");
		});
	});

	// *********************************************************************************************
	// API utility_page_log
	// *********************************************************************************************

	// Get current IP and init input with it
	$("#utility-log-page").click(function() {
		arc.api("utility_page_log", {}, function(o) {
			$("#utility-log-response").arcResponse(o);
		});
	});

	// *********************************************************************************************
	// API user_subscriber_new
	// *********************************************************************************************

	// Capcha
	$("#subscriber-capcha-refresh").click(function() {
		arc.api("utility_capcha_new", {
			token : $("#subscriber-capcha").data("token")
		}, function(data) {
			$("#subscriber-capcha").attr("src", arc.CAPCHA_PATH + data.data.token + ".png").data("token", data.data.token);
		});
	});

	// Subscription
	$("#subscriber-new").click(function() {
		arc.api("user_subscriber_new", {
			// Mandatory parameters
			mailid : $("#subscriber-email").val(),
			token : $("#subscriber-capcha").data("token"),
			capcha : $("#subscriber-capcha-input").val(),
			// Optional parameters. If missing, use default values
			callback : $("#subscriber-callback").val(),
			confirm_subject : $("#confirm-subject").val(),
			confirm_body : $("#confirm-body").val(),
			conclude_subject : $("#conclude-subject").val(),
			conclude_body : $("#conclude-body").val(),
			user_data : $("#user-data").val()
		}, function(o) {
			$("#subscriber-response").arcResponse(o);
		});
	});

	// *********************************************************************************************
	// API user_password_new
	// *********************************************************************************************

	// Capcha
	$("#password-capcha-refresh").click(function() {
		arc.api("utility_capcha_new", {
			token : $("#password-capcha").data("token")
		}, function(data) {
			$("#password-capcha").attr("src", arc.CAPCHA_PATH + data.data.token + ".png").data("token", data.data.token);
		});
	});

	// Password reset
	$("#password-new").click(function() {
		arc.api("user_password_new", {
			// Mandatory parameters
			mailid : $("#password-email").val(),
			token : $("#password-capcha").data("token"),
			capcha : $("#password-capcha-input").val(),
			// Optional parameters. If missing, use default values
			callback : $("#password-callback").val(),
			confirm_subject : $("#confirm-subject-pwd").val(),
			confirm_body : $("#confirm-body-pwd").val(),
			conclude_subject : $("#conclude-subject-pwd").val(),
			conclude_body : $("#conclude-body-pwd").val()
		}, function(o) {
			$("#password-response").arcResponse(o);
		});
	});

	// *********************************************************************************************
	// API user_session_start
	// *********************************************************************************************

	// Init Device ID. While local storage is preserved, the value is the same.
	// If local storage is cleared, a new value is defined.
	$("#subscriber-did").val(arc.deviceID());

	// Logon
	$("#subscriber-logon").click(function() {
		arc.api("user_session_start", {
			usr : $("#subscriber-usr").val(),
			pwd : $("#subscriber-pwd").val(),
			did : $("#subscriber-did").val(),
			ttl : $("#subscriber-ttl").val()
		}, function(o) {
			$("#subscriber-logon-response").arcResponse(o);

			// Logon is OK
			if (o.code == 200) {
				/* ***********************************************
				* Callback data:
				* 		- uid = User ID
				* 		- sid = Session ID
				* 		- eos = End of Session time (seconds since the Unix Epoch (January 1 1970 00:00:00 GMT))
				* 		- data = Any user profile data string up to 32K
				* ***********************************************/

				// Store session data locally in 'cakes' i.e. cookies-like data saved in local storage
				// Required by arc.io session system
				arc.userSessionStore(o.data.uid, o.data.sid, o.data.eos);

				// Set session UI
				$(".session > div").removeClass("led-red").addClass("led-green");
				$(".session > span").html("on");

			} else {

				// Stop any existing session

				// Clear session UI
				$(".session > div").removeClass("led-green").addClass("led-red");
				$(".session > span").html("off");

			}
		});
	});

	// *********************************************************************************************
	// API user_session_check
	// *********************************************************************************************

	$("#subscriber-session-check").click(function() {
		var requestSent = arc.apiSession("user_session_check", {}, function(o) {

			$("#subscriber-session-response").arcResponse(o);

			if (o.code == 200) {

				// Set session UI
				$(".session > div").removeClass("led-red").addClass("led-green");
				$(".session > span").html("on");

			} else {

				// Remove local session data
				arc.userSessionDelete();

				// Clear session UI
				$(".session > div").removeClass("led-green").addClass("led-red");
				$(".session > span").html("off");

			}

		});

		// As session based API does not fire when local session data are not valid,
		// in that case, UI and local data are reset
		if (!requestSent) {
			// Clear local session data
			arc.userSessionDelete();

			// Clear session UI
			$(".session > div").removeClass("led-green").addClass("led-red");
			$(".session > span").html("off");

			// Feedback
			$("#subscriber-session-response").html("<span style='color:red'>No valid local session data<span>");
		}
	});

	// *********************************************************************************************
	// API user_session_check
	// *********************************************************************************************

	$("#subscriber-session-stop").click(function() {
		arc.apiSession("user_session_stop", {}, function(o) {
			$("#subscriber-close-response").arcResponse(o);

			// Whatever the server response do local job !

			// Remove local session data
			arc.userSessionDelete();

			// Clear session UI
			$(".session > div").removeClass("led-green").addClass("led-red");
			$(".session > span").html("off");

		});
	});

	// *********************************************************************************************
	// API user_data_get
	// *********************************************************************************************

	$("#user-data-get").click(function() {
		arc.apiSession("user_data_get", {}, function(o) {
			$("#user-data-get-response").arcResponse(o);
			if (o.code == 200)
				$("#user-data-get-value").html(o.data.user_data);
			else
				$("#user-data-get-value").html("");
		});
	});

	// *********************************************************************************************
	// API user_data_set
	// *********************************************************************************************

	$("#user-data-set").click(function() {
		arc.apiSession("user_data_set", {
			user_data : $("#user-data-set-value").val()
		}, function(o) {
			$("#user-data-set-response").arcResponse(o);
		});
	});

	// *********************************************************************************************
	// API user_mobile_check
	// *********************************************************************************************
	$("#user-mobile-msg").val("Code to confirm your mobile phone number: %%code%%");

	$("#user-mobile-check").click(function() {
		arc.apiSession("user_mobile_check", {
			tel : $("#user-mobile-tel").val(),
			msg : $("#user-mobile-msg").val()
		}, function(o) {
			$("#user-mobile-response").arcResponse(o);
		});
	});

	// *********************************************************************************************
	// API user_mobile_match
	// *********************************************************************************************

	$("#user-mobile-match").click(function() {
		arc.apiSession("user_mobile_match", {
			code : $("#user-mobile-code").val(),
		}, function(o) {
			$("#user-mobile-match-response").arcResponse(o);
			if (o.code == 200)
				$("#user-mobile-match-value").html(o.data);
			else
				$("#user-mobile-match-value").html("");
		});
	});

	// *********************************************************************************************
	// API user_password_update
	// *********************************************************************************************

	$("#user-password-update").click(function() {
		arc.apiSession("user_password_update", {
			pwd : $("#user-password-value").val()
		}, function(o) {
			$("#user-password-response").arcResponse(o);
		});
	});

	// *********************************************************************************************
	// API user_subscriber_cancel
	// *********************************************************************************************

	$("#user-subscriber-cancel").click(function() {
		arc.apiSession("user_subscriber_cancel", {
			callback : $("#cancel-callback").val(),
			confirm_subject : $("#confirm-subject-cancel").val(),
			confirm_body : $("#confirm-body-cancel").val(),
			conclude_subject : $("#conclude-subject-cancel").val(),
			conclude_body : $("#conclude-body-cancel").val()
		}, function(o) {
			$("#user-subscriber-cancel-response").arcResponse(o);

			if (o.code == 200) {
				// Remove local session data
				arc.userSessionDelete();

				// Clear session UI
				$(".session > div").removeClass("led-green").addClass("led-red");
				$(".session > span").html("off");
			}
		});
	});

	// *********************************************************************************************
	// API content_pub
	// *********************************************************************************************
	$("#content-pub").click(function() {
		// Clear result and progress
		$("#content-pub-response, #content-pub-response-title, #content-pub-response-color, #content-pub-response-body").html("");

		// API call
		arc.api("content_pub", {
			cname : $("#content-pub-cname").val(),
			ctype : $("#content-pub-ctype").val(),
		}, function(o) {
			$("#content-pub-response").arcResponse(o);

			if (o.code == 200) {
				// Display returned data ID
				$("#content-pub-response-title").html(o.data[2]);
				$("#content-pub-response-color").html(o.data[1]);
				$("#content-pub-response-body").html(o.data[0]);
			}
		}, false, "get");
	});

	// *********************************************************************************************
	// API content_log
	// *********************************************************************************************
	$("#content-log").click(function() {
		// Clear result and progress
		$("#content-log-response, #content-log-response-log").html("");

		// API call
		arc.api("content_log", {
			cname : $("#content-log-cname").val(),
		}, function(o) {
			$("#content-log-response").arcResponse(o);

			if (o.code == 200) {
				// Display returned data ID
				$("#content-log-response-log").html("<ul></ul>");
				o.data.forEach(function(entry) {
					var cname = "<li><span class='code'>cname </span>" + entry[0] + "</li>";
					var title = "<li><span class='code'>title </span>" + entry[1] + "</li>";
					var author = "<li><span class='code'>author </span>" + entry[2] + "</li>";
					var archived = "<li><span class='code'>archive_date </span>" + entry[3] + "</li>";
					var archive = "<li><span class='code'>archive_name </span>" + entry[4] + "</li>";
					$("#content-log-response-log > ul").append("<li><ul>" + cname + title + author + archived + archive + "</ul></li>");
				});
			}
		}, false, "get");
	});

	// *********************************************************************************************
	// API data_up
	// *********************************************************************************************
	$("#data-up").click(function() {
		// Clear result and progress
		$("#data-up-response, #data-up-response-id").html("");
		$("data-up-progress > div > div").width(0);

		// API call
		arc.apiSession("data_up", {
			id : $("#data-up-id").val(),
			searchable : $("#data-up-searchable").val(),
			share : $("#data-up-share").val(),
			data : $("#data-up-data").val(),
		}, function(o) {
			$("#data-up-response").arcResponse(o);

			if (o.code == 200) {
				// Display returned data ID
				$("#data-up-response-id").html(o.data.data_id);
				$("#data-up-progress > div > div").width("100%");
			}
		}, false, "post", function(progressUp) {
			// Update progress bar
			$("#data-up-progress > div > div").width((progressUp * 100) + "%");
		}, false);
	});

	// *********************************************************************************************
	// API data_down
	// *********************************************************************************************
	$("#data-down").click(function() {
		// Clear result and progress
		$("#data-down-response, #form-data-down .value").html("");
		$("data-down-progress > div > div").width(0);

		// API call
		arc.apiSession("data_down", {
			id : $("#data-down-id").val(),
		}, function(o) {
			$("#data-down-response").arcResponse(o);

			if (o.code == 200) {
				// Display returned data ID
				$("#data-down-response-data").html(o.data.data);
				$("#data-down-response-text").html(o.data.text);
				$("#data-down-response-count-down").html(o.data.count_down);
				$("#data-down-response-count-up").html(o.data.count_up);
				$("#data-down-response-created-on").html(o.data.created_on);
				$("#data-down-response-created-by").html(o.data.created_by);
				$("#data-down-response-updated-on").html(o.data.updated_on);
				$("#data-down-response-updated-by").html(o.data.updated_by);
				$("#data-down-response-share").html(o.data.share);
				$("#data-down-progress > div > div").width("100%");
			}
		}, false, "post", false, function(progressDown) {
			// Update progress bar
			$("#data-down-progress > div > div").width((progressDown * 100) + "%");
		});
	});

	// *********************************************************************************************
	// API data_search
	// *********************************************************************************************
	$("#data-search").click(function() {
		// Clear result
		$("#data-search-response, #data-search-response-list").html("");

		// API call
		arc.apiSession("data_search", {
			search : $("#data-search-search").val(),
		}, function(o) {
			$("#data-search-response").arcResponse(o);

			if (o.code == 200) {

				// Own data
				if (o.data.own.length == 0)
					$("#data-search-response-own").html("Empty list");
				else {
					$("#data-search-response-own").html("<ul><ul>");
					o.data.own.forEach(function(desc) {
						$("#data-search-response-own > ul").append("<li style='font-family:Courier;font-size:90%'>" + desc[0] + " " + desc[1] + " " + desc[2] + " " + "</li>");
					});
				}

				// Shared business data
				if (o.data.business.length == 0)
					$("#data-search-response-business").html("Empty list");
				else {
					$("#data-search-response-business").html("<ul><ul>");
					o.data.business.forEach(function(desc) {
						$("#data-search-response-business > ul").append("<li style='font-family:Courier;font-size:90%'>" + desc[0] + " " + desc[1] + " " + desc[2] + " " + "</li>");
					});
				}

				// Shared business data
				if (o.data.world.length == 0)
					$("#data-search-response-world").html("Empty list");
				else {
					$("#data-search-response-world").html("<ul><ul>");
					o.data.world.forEach(function(desc) {
						$("#data-search-response-world > ul").append("<li style='font-family:Courier;font-size:90%'>" + desc[0] + " " + desc[1] + " " + desc[2] + " " + "</li>");
					});
				}

			}
		});
	});
	// *********************************************************************************************
	// API data_list
	// *********************************************************************************************
	// Default values in input
	$("#data-pagelen").val(100);
	$("#data-pagenum").val(0);

	$("#data-list").click(function() {
		// Clear result
		$("#data-list-response, #data-list-response-list, #data-list-response-lines").html("");

		// API call
		arc.apiSession("data_list", {
			pagelen : $("#data-pagelen").val(),
			pagenum : $("#data-pagenum").val()
		}, function(o) {
			$("#data-list-response").arcResponse(o);

			if (o.code == 200) {
				// Data descriptor list
				if (o.data.list.length == 0)
					$("#data-list-response-list").html("Empty list");
				else {
					$("#data-list-response-list").html("<ul><ul>");
					o.data.list.forEach(function(desc) {
						var line = "";
						desc.forEach(function(field) {
							line = line + field + " ";
						});
						$("#data-list-response-list > ul").append("<li style='font-family:Courier;font-size:90%'>" + line + "</li>");
					});
				}

				// Total number of data
				$("#data-list-response-lines").html(o.data.lines);
			}
		});
	});

	// *********************************************************************************************
	// API data_delete
	// *********************************************************************************************
	$("#data-delete").click(function() {
		// Clear result
		$("#data-delete-response").html("");

		// API call
		arc.apiSession("data_delete", {
			id : $("#data-delete-id").val(),
		}, function(o) {
			$("#data-delete-response").arcResponse(o);
		});
	});

	// *********************************************************************************************
	// API monitor_stat
	// *********************************************************************************************
	$("#monitor-stat").click(function() {

		// Clear result
		$("#monitor-stat-response").html("");
		$("#monitor-stat-response-stat").html("<ul></ul>");

		// API call
		arc.api("monitor_stat", {
			secret : $("#monitor-stat-secret").val(),
			apiName : $("#monitor-stat-apiName").val()
		}, function(o) {
			$("#monitor-stat-response").arcResponse(o);

			if (o.code == 200) {
				$("#monitor-stat-response-stat ul").append("<li>Latest day calls = " + o.data.day + "</li>");
				$("#monitor-stat-response-stat ul").append("<li>Latest week calls = " + o.data.week + "</li>");
				$("#monitor-stat-response-stat ul").append("<li>Latest month calls = " + o.data.month + "</li>");
				$("#monitor-stat-response-stat ul").append("<li>Latest quarter calls = " + o.data.quarter + "</li>");
				$("#monitor-stat-response-stat ul").append("<li>Latest year calls = " + o.data.year + "</li>");
			}
		});
	});

});
/* =============================================================================================
 * EoF
 * ============================================================================================= */