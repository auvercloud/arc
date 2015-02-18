<?php
/* ******************************************************************************
 * AUVERCLOUD PHP RUNTIME AND FUNCTION LIB
 * AUTHOR: guillaume@dorbes.com
 * VERSION: 2.0
 * ==============================================================================
 * REQUIREMENTS: See at the end of this file
 * https://www.auvercloud.com/run/css/arc.css is required for content publishing
 * ==============================================================================
 * 3D PARTY  REQUIREMENTS: See the end of this file
 * Mandatory: jQuery 2.x or more (http://jquery.com/download/)
 ********************************************************************************
 *
 * Copyright 2014,2015 Guillaume DORBES.
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
 ******************************************************************************** */

/* EXAMPLE OF USE
 *  ## Create an instance with an application key as parameter
 * $my_instance = new AuverCloud("012345678901234567890123456789012345678901234");
 *
 * ## Call a method that returns HMTL or RSS data:
 * #### Simple content
 * 		echo $my_instance -> content("text", "my_text_content_id");
 * #### Log of archived version of a text content
 *		echo $my_instance -> log("my_text_content_id");
 * #### Blog build with latest and archived version of a text content
 * 		echo $my_instance -> blog("my_text_content_id");
 * #### RSS build with latest and archived version of a text content
 *      echo $my_instance-> rss("my_text_content_id", 10, "https://www.myblog.com", "Any title", "en-us", "Any description");
 ******************************************************************************** */

class AuverCloud {

	// API server address
	const API_SERVER = "https://api.auvercloud.com";

	// JS library
	const LIB_ARC = "https://www.auvercloud.com/run/min/arc.min.js";

	// HTML error message
	const ERR_HTML = "<div><h1 style='background:red;color:white'>Error %%code%%: %%msg%%</h1></div>";

	// RSS PICTURE URL
	const RSS_PIC = "https://www.auvercloud.com/all/ani/cloud.anim.102x102.gif";

	/* Function: content
	 * Purpose: Construct new object
	 * Parameter(s):- $key = Application Key
	 * 				- $js_load = Optional flag to load JS client. Default = false.
	 * 				- $js_run = Optional. Insert Javascript client launch. Default = true.
	 * ********************************************************************************/
	function __construct($key, $js_load = false, $js_run = true) {
		$this -> app_key = $key;
		if ($js_load) {
			echo "<script src='" . self::LIB_ARC . "'></script>";
		}

		if ($js_run) {
			echo "<script>$(function(){arc.run('" . $this -> app_key . "')});</script>";
		}
	}

	/* Function: my_key
	 * Purpose: Return the application key set by constructor for test.
	 * ********************************************************************************/
	function my_key() {
		return $this -> app_key;
	}

	/* Function: os
	 * Purpose: Return Operating System found in user agent
	 * Comment: The order of tests is important as user agent may be ambiguous
	 * ********************************************************************************/
	function os() {
		$ua = strtolower($_SERVER['HTTP_USER_AGENT']);
		if (strrpos($ua, "iemobile"))
			return "wphone";
		if (strrpos($ua, "windows"))
			return "windows";
		if (strrpos($ua, "iphone") || strrpos($ua, "ipad") || strrpos($ua, "ipod"))
			return "ios";
		if (strrpos($ua, "android"))
			return "android";
		if (strrpos($ua, "mac"))
			return "osx";
		if (strrpos($ua, "linux"))
			return "linux";
		return "other";
	}

	/* Function: browser
	 * Purpose: Return the Browser found in user agent
	 * Comment: The order of tests is important as user agent may be ambiguous
	 * ********************************************************************************/
	function browser() {
		$ua = strtolower($_SERVER['HTTP_USER_AGENT']);
		if (strrpos($ua, "chrome"))
			return "chrome";
		if (strrpos($ua, "firefox"))
			return "firefox";
		if (strrpos($ua, "opera"))
			return "opera";
		if (strrpos($ua, "silk"))
			return "silk";
		if (strrpos($ua, "crios"))
			return "mchrome";
		if (strrpos($ua, "mobile") && strrpos($ua, "safari"))
			return "msafari";
		if (strrpos($ua, "safari"))
			return "safari";
		if (strrpos($ua, "msie"))
			return "msie";
		return "other";
	}

	/* Function:ip
	 * Purpose: Return Client IP. Prevents wrong value due to IP failover or proxy
	 * ****************************************************************************/
	function ip() {
		$ipaddress = '';
		if ($_SERVER['HTTP_CLIENT_IP'])
			$ipaddress = $_SERVER['HTTP_CLIENT_IP'];
		else if ($_SERVER['HTTP_X_FORWARDED_FOR'])
			$ipaddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
		else if ($_SERVER['HTTP_X_FORWARDED'])
			$ipaddress = $_SERVER['HTTP_X_FORWARDED'];
		else if ($_SERVER['HTTP_FORWARDED_FOR'])
			$ipaddress = $_SERVER['HTTP_FORWARDED_FOR'];
		else if ($_SERVER['HTTP_FORWARDED'])
			$ipaddress = $_SERVER['HTTP_FORWARDED'];
		else
			$ipaddress = $_SERVER['REMOTE_ADDR'];

		// In case of error default value = 0.0.0.0
		if (strlen($ipaddress) < 7)
			$ipaddress = "0.0.0.0";

		return $ipaddress;
	}

	/* Function: getAPI
	 * Purpose: Get request to API server and error catching
	 * Parameter(s):	- $request
	 * Return: Associative array: Response code, error message, data
	 * ********************************************************************************/
	function getAPI($request) {
		// Get data and catch error
		try {
			// Get data
			$response = json_decode(file_get_contents($request), true);
		} catch(exception $e) {
			$response = array("code" => "500", "msg" => "Connection error. Please try again later.", "data" => "");
		}
		return $response;
	}

	/* Function: content
	 * Purpose: Return HTML content from API server
	 * Parameter(s):- $type = Content type
	 * 				- $name = Content name
	 * 				- $date = Optional archive date
	 * ********************************************************************************/
	function content($type, $name, $date = "not_bound") {

		// Optional date parameter
		if (!$date || $date == "not_bound")
			$date = "0000-00-00 00:00:00";

		// Get API server
		$res = $this -> getAPI(self::API_SERVER . '?api=content_pub&key=' . $this -> app_key . '&cname=' . $name . '&ip=' . $this -> ip() . '&udate=' . urlencode($date) . '&ctype=' . $type . '&deviceOS=' . $this -> os() . '&deviceBrowser=' . $this -> browser());

		// Return HTML error message if any
		if ($res["code"] != "200") {
			$html = self::ERR_HTML;
			$html = str_replace("%%code%%", $res["code"], $html);
			$html = str_replace("%%msg%%", $res["msg"], $html);
			return $html;
		}

		// Otherwise return content according to type
		switch($type) {
			case "text" :
				$html = "<div class='arc-title'>" . $res["data"][2] . "</div><div class='arc-style-normal' style='background-color:" . $res["data"][1] . "'>" . $res["data"][0] . "</div>";
				break;
			case "picture" :
				// NB: Picture and slideshow are post-processed by JavaScript client
				$html = "<div style='width:100%;height:100%' arc-picture='" . $name . "'></div>";
				break;
			case "menu" :
				$menu = json_decode($res["data"][0]);
				$html = "<ul class='arc menu'>";
				foreach ($menu as $item) {
					if (isset($item -> url)) {
						// Link item
						if ($item -> blank)
							$target = "_blank";
						else
							$target = "_self";
						$html = $html . "<li><a href='" . $item -> url . "' target='" . $target . "'>" . $item -> name . "</a></li>";
					} else {
						// Menu item
						$html = $html . "<li class='submenu'><span>" . $item -> name . "</span><ul>";
						foreach ($item->menu as $sub_item) {
							// Link item
							if ($sub_item -> blank)
								$target = "_blank";
							else
								$target = "_self";
							$html = $html . "<li><a href='" . $sub_item -> url . "' target='" . $target . "'>" . $sub_item -> name . "</a></li>";
						}
						$html = $html . "</ul></li>";
					}
				}
				$html = $html . "</ul>";
				break;
			case "frame" :
				$html = "<div class='arc-title'>" . $res["data"][2] . "</div><iframe class='arc-frame' src='" . $res["data"][0] . "'></iframe>";
				break;
		}
		return $html;
	}

	/* Function: log
	 * Purpose: Return HTML content log from API server
	 * Parameter(s): $name = Content name
	 * ********************************************************************************/
	function log($name) {

		// Get API server
		$res = $this -> getAPI(self::API_SERVER . '?api=content_log&key=' . $this -> app_key . '&cname=' . $name . '&ip=' . $this -> ip());

		// Return HTML error message if any
		if ($res["code"] != "200") {
			$html = self::ERR_HTML;
			$html = str_replace("%%code%%", $res["code"], $html);
			$html = str_replace("%%msg%%", $res["msg"], $html);
			return $html;
		}

		$uri_parts = explode('?', $_SERVER['REQUEST_URI'], 2);
		$uri = "https://" . $_SERVER['HTTP_HOST'] . $uri_parts[0];

		// Latest post
		$latest_item = array_shift($data);
		$html = "<div class='arc-log-latest'><a href='" . $uri . "'>" . $latest_item[1] . "<a></div>";

		// Init list
		$month = "";
		foreach ($res["data"] as $content) {
			$this_month = substr($content[3], 0, 7);
			if ($this_month != $month) {
				if ($month != "")
					$html = $html . "</ul>";
				$month = $this_month;
				$html = $html . "<ul class='arc-log'><div><span>+</span>" . $month . "</div>";
			}
			if ($content[4] != "")
				$html = $html . "<li><a href='" . $uri . "?udate=" . urlencode($content[3]) . "'>" . $content[1] . "<a></li>";
		}
		return $html . "</ul>";
	}

	/* Function: rss
	 * Purpose: Return RSS feed based on blog build with content text
	 * Parameter(s):- $name = Text content name
	 * 				- $max = Maximum number of items to publish in the RSS
	 * 				- $blog_url = URL of the referred PHP blog
	 * 				- $rss_language
	 * 				- $rss_description
	 * ********************************************************************************/
	function rss($name, $max, $blog_url, $rss_title, $rss_language, $rss_description) {

		// Get API server
		$res = $this -> getAPI(self::API_SERVER . '?api=content_log&key=' . $this -> app_key . '&cname=' . $name . '&ip=' . $this -> ip());

		// Return HTML error message if any
		if ($res["code"] != "200") {
			$html = self::ERR_HTML;
			$html = str_replace("%%code%%", $res["code"], $html);
			$html = str_replace("%%msg%%", $res["msg"], $html);
			return $html;
		}

		// MIME type and encoding
		header('Content-Type: application/rss+xml;charset= utf-8 ');
		$html = "<?xml version='1.0' encoding='UTF-8' ?>";

		// Current URL
		$rss_url = "https://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];

		// RSS Channel description
		$html = $html . "<rss version='2.0' xmlns:atom='http://www.w3.org/2005/Atom'><channel>";
		$html = $html . "<title>" . $rss_title . "</title>";
		$html = $html . "<link>" . $blog_url . "</link>";
		$html = $html . "<description>" . $rss_description . "</description>";
		$html = $html . "<atom:link href='" . $rss_url . "' rel='self' type='application/rss+xml' />";

		// RSS image
		$html = $html . "<image><url>" . self::RSS_PIC . "</url><title>" . $rss_title . "</title><link>" . $blog_url . "</link></image>";

		// RSS option
		$html = $html . "<language>" . $rss_language . "</language>";
		$html = $html . "<ttl>60</ttl>";

		// Fill channel with latest items
		$i = 0;
		$max = min(count($res["data"]), $max);
		while ($i < $max) {

			// Retrieve content
			if ($res["data"][$i][3] != "")
				$udate = urlencode($res["data"][$i][3]);
			else
				$udate = urlencode("0000-00-00 00:00:00");
			$item_data = json_decode(file_get_contents(self::API_SERVER . '?api=content_pub&key=' . $this -> app_key . '&cname=' . $name . '&udate=' . $udate . '&ctype=text&deviceOS=rss&deviceBrowser=rss'), true);

			// Insert content
			$html = $html . "<item>";
			$html = $html . "<title>" . $res["data"][$i][1] . "</title>";
			$html = $html . "<link>" . $blog_url . "?udate=" . $udate . "</link>";
			$html = $html . "<guide>" . $blog_url . "?udate=" . $udate . "</guide>";
			$html = $html . "<description><![CDATA[" . $item_data["data"][0] . "]]></description>";

			// Insert date: Now for latest or archive date otherwise
			if ($res["data"][$i][3] != "")
				$date = date("r", strtotime($res["data"][$i][3]));
			else
				$date = date("r", strtotime("now"));
			$html = $html . "<pubDate>" . $date . "</pubDate>";

			// End of item
			$html = $html . "</item>";

			// Next until max.
			$i = $i + 1;
		}

		// End of RSS
		return $html . "</channel></rss>";
	}

	/* Function: blog
	 * Purpose: Return the list of the latest and archived versions of a content
	 * Comments: See HTML structure hereinafter, especially the classes .blog-post,
	 * 			 .blog-post-title and .blog-post-body that require CSS customization
	 * Parameter(s):- $name = Content name
	 * 				- $max = Optional: Maximum number of items to publish. Default = 10
	 * 				- $bg = Optional: Boolean to apply or not the background color. Default = true
	 * ********************************************************************************/
	function blog($name, $max = 10, $bg = true) {

		// Get API server
		$res = $this -> getAPI(self::API_SERVER . '?api=content_log&key=' . $this -> app_key . '&cname=' . $name . '&ip=' . $this -> ip());

		// Return HTML error message if any
		if ($res["code"] != "200") {
			$html = self::ERR_HTML;
			$html = str_replace("%%code%%", $res["code"], $html);
			$html = str_replace("%%msg%%", $res["msg"], $html);
			return $html;
		}

		// Return content
		$i = 0;
		$max = min(count($res["data"]), $max);
		$html = "";
		while ($i < $max) {

			// Retrieve content
			if ($res["data"][$i][3] != "")
				$udate = urlencode($res["data"][$i][3]);
			else
				$udate = urlencode("0000-00-00 00:00:00");
			$item_data = json_decode(file_get_contents(self::API_SERVER . '?api=content_pub&key=' . $this -> app_key . '&cname=' . $name . '&udate=' . $udate . '&ctype=text&deviceOS=blog&deviceBrowser=blog'), true);

			// Insert post with appropriate background
			$bg_style = "";
			if ($bg) {
				$bg_style = "style='background-color:" . $item_data["data"][1] . ";'";
			}
			$html = $html . "<div class='blog-post'>";
			// h1 si supposed to be the page title/topic
			$html = $html . "<h2 class='blog-post-title'>" . $item_data["data"][2] . "</h2>";
			$html = $html . "<div class='blog-post-body' " . $bg_style . ">" . $item_data["data"][0] . "</div>";

			// End of post
			$html = $html . "</div>";

			// Next until max.
			$i = $i + 1;
		}
		return $html;
	}

}
?>