<?php
/* ******************************************************************************
 * UTILITIES FOR AUVERCLOUD CONTENT LOADING FROM PHP BASED PAGES
 * AUTHOR: guillaume@dorbes.com
 * VERSION: 3.0
 * ==============================================================================
 * REQUIREMENTS: https://www.auvercloud.com/run/css/arc.css is required
 * 				 for content publishing
 * ==============================================================================
 * 3D PARTY REQUIREMENTS: jQuery 2.x (http://jquery.com/download/) is only required
 * 						  for slideshow content animation and user events
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
 * Create an instance with an application key as parameter
 * >>> $my_instance = new AuverCloud("012345678901234567890123456789012345678901234");
 *
 * Retrieve HTML content
 * 	>>> echo $my_instance -> content("text", "my_text_content_id");
 ******************************************************************************** */

class AuverCloud {

	// API server address
	const API_SERVER = "https://api.auvercloud.com/";

	/* Function: __construct
	 * Purpose: Construct new instance
	 * Parameter(s):- $key = Application Key
	 * ********************************************************************************/
	function __construct($key) {
		$this -> app_key = $key;
	}

	/* Function: my_key
	 * Purpose: Return the application key set by constructor for test.
	 * ********************************************************************************/
	function my_key() {
		return $this -> app_key;
	}

	/* Function: content
	 * Purpose: Get and return HTML content.
	 * Parameter(s):- $type = Content type
	 * 				- $name = Content name
	 * 				- $option = Associative array of options. See details below
	 * ********************************************************************************/
	function content($type, $name, $option) {

		// Optional application key or the default one defined on construction
		if (!isset($option["key"]))
			$key = $this -> app_key;
		else
			$key = $option["key"];

		// Optional date of the default date
		if (!isset($option["date"]))
			$date = "0000-00-00 00:00:00";
		else
			$date = $option["date"];

		// Call
		try {
			// Success
			return file_get_contents(self::API_SERVER . '?api=content_pub&key=' . $key . '&cname=' . $name . '&udate=' . urlencode($date) . '&ctype=' . $type . '&deviceIP=' . $this -> device_ip() . '&deviceOS=' . $this -> device_os() . '&deviceBrowser=' . $this -> device_browser() . '&deviceType=' . $this -> device_type() . '&deviceDomain=' . $this -> device_domain());
		} catch(exception $e) {
			// Failure
			return "<h1 style='background-color:#a00;color:#fff;'>Connection error. Please try again later: " . $e -> getMessage() . "</h1>";
		}
	}

	/* Function: device_os
	 * Purpose: Return the Operating System found in user agent
	 * Comment: The order of tests is important as user agent may be ambiguous
	 * ********************************************************************************/
	function device_os() {
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

	/* Function: device_browser
	 * Purpose: Return the Browser found in user agent
	 * Comment: The order of tests is important as user agent may be ambiguous
	 * ********************************************************************************/
	function device_browser() {
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

	/* Function: device_type
	 * Purpose: Return the device type
	 * Comment: computer, mobile, other
	 * ********************************************************************************/
	function device_type() {
		$os = $this -> device_os();

		if ($os == "android" || $os == "ios" || $os == "wphone")
			return "mobile";
		if ($os == "windows" || $os == "osx" || $os == "linux")
			return "computer";
		return "other";
	}

	/* Function: device_ip
	 * Purpose: Return Client IP. Prevents wrong value due to IP failover or proxy
	 * ****************************************************************************/
	function device_ip() {
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

	/* Function: device_domain
	 * Purpose: Return Client domain
	 * ****************************************************************************/
	function device_domain() {
		$url = parse_url($_SERVER['HTTP_REFERER']);
		return $url["host"];
	}

}
?>