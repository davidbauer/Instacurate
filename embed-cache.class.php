<?php
class embedcache {

    protected   $cache_dir = './embed-cache/',
                $cache_limit = 30, // in days
                $api_url = 'http://api.embed.ly/1/oembed',
                $api_params = array(
                            'key' => 'ab0fdaa34f634136bf4eb2325e040527'
                            );
    var         $url = '',
                $params = array(),
                $cache_file = '',
                $error = null;


    function embedcache() {
        if(!is_dir($this->cache_dir)) {
            if(!mkdir($this->cache_dir, 0777)) {
                $this->error = 'Couldn’t create cache dir '.$this->cache_dir;
            }
        }
    }

    function getEmbed($url, $params = array()) {
        if($this->isUrl($url)) {
            $hash = $this->hash($url, $params);
            $cache_file = $this->cache_dir . $hash . '.json';
            
            if(file_exists($cache_file)) {
                return implode(file($cache_file));
            } else {
                return $this->cache($url, $params, $cache_file);
            }
        } else {
            $this->error = 'Invalid url was given';
        }
    }

    function hash($url, $params = array()) {
        $str = $url . (count($params)?'?'.$this->buildQueryString($params):'');
        return md5($str);        
    }

    function cache($url, $params, $cache_file) {
        $params = array_merge(
            $this->api_params,
            array(
                'url' => $url
            ),
            $params
        );
        $api_request = $this->api_url . '?' . $this->buildQueryString($params);
        if(($response = $this->http($api_request))) {
            $f_cache = fopen($cache_file, 'w');
            fwrite($f_cache, $response);
            fclose($f_cache);
            return $response;
        } else {
            return false;
        }
    }

    function isUrl($url) {
        return preg_match('/^[a-z](?:[-a-z0-9\+\.])*:(?:\/\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\x{A0}-\x{D7FF}\x{F900}-\x{FDCF}\x{FDF0}-\x{FFEF}\x{10000}-\x{1FFFD}\x{20000}-\x{2FFFD}\x{30000}-\x{3FFFD}\x{40000}-\x{4FFFD}\x{50000}-\x{5FFFD}\x{60000}-\x{6FFFD}\x{70000}-\x{7FFFD}\x{80000}-\x{8FFFD}\x{90000}-\x{9FFFD}\x{A0000}-\x{AFFFD}\x{B0000}-\x{BFFFD}\x{C0000}-\x{CFFFD}\x{D0000}-\x{DFFFD}\x{E1000}-\x{EFFFD}!\$&\'\(\)\*\+,;=:])*@)?(?:\[(?:(?:(?:[0-9a-f]{1,4}:){6}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|::(?:[0-9a-f]{1,4}:){5}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:[0-9a-f]{1,4}:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|v[0-9a-f]+[-a-z0-9\._~!\$&\'\(\)\*\+,;=:]+)\]|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3}|(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\x{A0}-\x{D7FF}\x{F900}-\x{FDCF}\x{FDF0}-\x{FFEF}\x{10000}-\x{1FFFD}\x{20000}-\x{2FFFD}\x{30000}-\x{3FFFD}\x{40000}-\x{4FFFD}\x{50000}-\x{5FFFD}\x{60000}-\x{6FFFD}\x{70000}-\x{7FFFD}\x{80000}-\x{8FFFD}\x{90000}-\x{9FFFD}\x{A0000}-\x{AFFFD}\x{B0000}-\x{BFFFD}\x{C0000}-\x{CFFFD}\x{D0000}-\x{DFFFD}\x{E1000}-\x{EFFFD}!\$&\'\(\)\*\+,;=@])*)(?::[0-9]*)?(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\x{A0}-\x{D7FF}\x{F900}-\x{FDCF}\x{FDF0}-\x{FFEF}\x{10000}-\x{1FFFD}\x{20000}-\x{2FFFD}\x{30000}-\x{3FFFD}\x{40000}-\x{4FFFD}\x{50000}-\x{5FFFD}\x{60000}-\x{6FFFD}\x{70000}-\x{7FFFD}\x{80000}-\x{8FFFD}\x{90000}-\x{9FFFD}\x{A0000}-\x{AFFFD}\x{B0000}-\x{BFFFD}\x{C0000}-\x{CFFFD}\x{D0000}-\x{DFFFD}\x{E1000}-\x{EFFFD}!\$&\'\(\)\*\+,;=:@]))*)*|\/(?:(?:(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\x{A0}-\x{D7FF}\x{F900}-\x{FDCF}\x{FDF0}-\x{FFEF}\x{10000}-\x{1FFFD}\x{20000}-\x{2FFFD}\x{30000}-\x{3FFFD}\x{40000}-\x{4FFFD}\x{50000}-\x{5FFFD}\x{60000}-\x{6FFFD}\x{70000}-\x{7FFFD}\x{80000}-\x{8FFFD}\x{90000}-\x{9FFFD}\x{A0000}-\x{AFFFD}\x{B0000}-\x{BFFFD}\x{C0000}-\x{CFFFD}\x{D0000}-\x{DFFFD}\x{E1000}-\x{EFFFD}!\$&\'\(\)\*\+,;=:@]))+)(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\x{A0}-\x{D7FF}\x{F900}-\x{FDCF}\x{FDF0}-\x{FFEF}\x{10000}-\x{1FFFD}\x{20000}-\x{2FFFD}\x{30000}-\x{3FFFD}\x{40000}-\x{4FFFD}\x{50000}-\x{5FFFD}\x{60000}-\x{6FFFD}\x{70000}-\x{7FFFD}\x{80000}-\x{8FFFD}\x{90000}-\x{9FFFD}\x{A0000}-\x{AFFFD}\x{B0000}-\x{BFFFD}\x{C0000}-\x{CFFFD}\x{D0000}-\x{DFFFD}\x{E1000}-\x{EFFFD}!\$&\'\(\)\*\+,;=:@]))*)*)?|(?:(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\x{A0}-\x{D7FF}\x{F900}-\x{FDCF}\x{FDF0}-\x{FFEF}\x{10000}-\x{1FFFD}\x{20000}-\x{2FFFD}\x{30000}-\x{3FFFD}\x{40000}-\x{4FFFD}\x{50000}-\x{5FFFD}\x{60000}-\x{6FFFD}\x{70000}-\x{7FFFD}\x{80000}-\x{8FFFD}\x{90000}-\x{9FFFD}\x{A0000}-\x{AFFFD}\x{B0000}-\x{BFFFD}\x{C0000}-\x{CFFFD}\x{D0000}-\x{DFFFD}\x{E1000}-\x{EFFFD}!\$&\'\(\)\*\+,;=:@]))+)(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\x{A0}-\x{D7FF}\x{F900}-\x{FDCF}\x{FDF0}-\x{FFEF}\x{10000}-\x{1FFFD}\x{20000}-\x{2FFFD}\x{30000}-\x{3FFFD}\x{40000}-\x{4FFFD}\x{50000}-\x{5FFFD}\x{60000}-\x{6FFFD}\x{70000}-\x{7FFFD}\x{80000}-\x{8FFFD}\x{90000}-\x{9FFFD}\x{A0000}-\x{AFFFD}\x{B0000}-\x{BFFFD}\x{C0000}-\x{CFFFD}\x{D0000}-\x{DFFFD}\x{E1000}-\x{EFFFD}!\$&\'\(\)\*\+,;=:@]))*)*|(?!(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\x{A0}-\x{D7FF}\x{F900}-\x{FDCF}\x{FDF0}-\x{FFEF}\x{10000}-\x{1FFFD}\x{20000}-\x{2FFFD}\x{30000}-\x{3FFFD}\x{40000}-\x{4FFFD}\x{50000}-\x{5FFFD}\x{60000}-\x{6FFFD}\x{70000}-\x{7FFFD}\x{80000}-\x{8FFFD}\x{90000}-\x{9FFFD}\x{A0000}-\x{AFFFD}\x{B0000}-\x{BFFFD}\x{C0000}-\x{CFFFD}\x{D0000}-\x{DFFFD}\x{E1000}-\x{EFFFD}!\$&\'\(\)\*\+,;=:@])))(?:\?(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\x{A0}-\x{D7FF}\x{F900}-\x{FDCF}\x{FDF0}-\x{FFEF}\x{10000}-\x{1FFFD}\x{20000}-\x{2FFFD}\x{30000}-\x{3FFFD}\x{40000}-\x{4FFFD}\x{50000}-\x{5FFFD}\x{60000}-\x{6FFFD}\x{70000}-\x{7FFFD}\x{80000}-\x{8FFFD}\x{90000}-\x{9FFFD}\x{A0000}-\x{AFFFD}\x{B0000}-\x{BFFFD}\x{C0000}-\x{CFFFD}\x{D0000}-\x{DFFFD}\x{E1000}-\x{EFFFD}!\$&\'\(\)\*\+,;=:@])|[\x{E000}-\x{F8FF}\x{F0000}-\x{FFFFD}|\x{100000}-\x{10FFFD}\/\?])*)?(?:\#(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\x{A0}-\x{D7FF}\x{F900}-\x{FDCF}\x{FDF0}-\x{FFEF}\x{10000}-\x{1FFFD}\x{20000}-\x{2FFFD}\x{30000}-\x{3FFFD}\x{40000}-\x{4FFFD}\x{50000}-\x{5FFFD}\x{60000}-\x{6FFFD}\x{70000}-\x{7FFFD}\x{80000}-\x{8FFFD}\x{90000}-\x{9FFFD}\x{A0000}-\x{AFFFD}\x{B0000}-\x{BFFFD}\x{C0000}-\x{CFFFD}\x{D0000}-\x{DFFFD}\x{E1000}-\x{EFFFD}!\$&\'\(\)\*\+,;=:@])|[\/\?])*)?$/iu',$url)?true:false;
    }

    function cleanUp() {
        $d = dir($this->cache_dir);
        $limit = time() - $this->cache_limit * 86400;
        $deleted = 0;
        while($f = $d->read()) {
            $path = $d->path . $f; 
            if(file_exists($path)) {
                if(fileatime($path) < $limit) {
                    unlink($path);
                    $deleted++;
                }
            }
        }
        return $deleted;
    }

    function http($url, $data = NULL, $options = array(), $headers=array()) {
        $ci = curl_init();
       
        /* Curl settings */
        $default_headers = array(
            'Expect:'
            //'Content-Type: application/x-www-form-urlencoded',
            //'Accept: /'
            );
        if(is_array($headers)) {
            $headers = array_merge($default_headers, $headers);
        } else {
            $headers = $default_headers;
        }      
        $defaults = array(
            CURLOPT_USERAGENT => "Instacurate",
            CURLOPT_CONNECTTIMEOUT => 30,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_SSL_VERIFYPEER => FALSE,
            CURLOPT_RETURNTRANSFER => TRUE,
            CURLOPT_HEADERFUNCTION => array($this, 'getHeader'),
            CURLOPT_HEADER => FALSE
        );
        foreach($defaults as $index=>$option) {
            if(!array_key_exists($index, $options)) {
                $options[$index] = $option;
            }
        }
        //$options = array_merge($defaults, $options);
        curl_setopt_array($ci, $options);

        if(isset($data))
        {
            if(is_array($data)) {
                $data = $this->buildQueryString($data);
            }
            curl_setopt($ci, CURLOPT_POST, 1);
            curl_setopt($ci, CURLOPT_POSTFIELDS, $data);
        }        
        
        curl_setopt($ci, CURLOPT_URL, $url);
        if(!$response = curl_exec($ci)) { 
            trigger_error(curl_error($ci)); 
        }  
        $this->http_info['code'] = curl_getinfo($ci, CURLINFO_HTTP_CODE);
        $this->http_info['curl_info'] = curl_getinfo($ci);
        curl_close ($ci);
        return $response;

        if(strpos($this->http_info['code'], '200')) {
            return $response;
        } else {
            $this->error = $this->http_info['code'];
            return false;
        }
    }   
    /**
     * Normalize url
     */
    public function normalizeUrl($url) {
        if(is_scalar($url) && $parts = parse_url($url)) {
            $port = @$parts['port'];
            $scheme = $parts['scheme'];
            $host = $parts['host'];
            $path = @$parts['path'];
            
            $port or $port = ($scheme == 'https') ? '443' : '80';
            
            if (($scheme == 'https' && $port != '443')
                || ($scheme == 'http' && $port != '80')) {
              $host = "$host:$port";
            }
            return "$scheme://$host$path";
        } else {
            return false;
        }
    }
    
    /**
     * Get the header info
     */
    function getHeader($ch, $header) {
        $i = strpos($header, ':');
        if (!empty($i)) {
            $key = str_replace('-', '_', strtolower(substr($header, 0, $i)));
            $value = trim(substr($header, $i + 2));
            $this->http_info['header'][$key] = $value;
        }
        return strlen($header);
    }
    
    /**
     * This function takes a input like a=b&a=c&d=e and returns the parsed
     * parameters like this
     * array('a' => array('b','c'), 'd' => 'e')
     * originally written by Abraham Williams
     */
    public function parseParameters( $params ) {
        if (!isset($params) || !$params) return array();
        $pairs = explode('&', $params);
        $parsed_parameters = array();
        foreach ($pairs as $pair) {
            $split = explode('=', $pair, 2);
            $parameter = $this->urlDecode($split[0]);
            $value = isset($split[1]) ? $this->urlDecode($split[1]) : '';
            if (isset($parsed_parameters[$parameter])) {
                // We have already recieved parameter(s) with this name, so add to the list
                // of parameters with this name
                if (is_scalar($parsed_parameters[$parameter])) {
                    // This is the first duplicate, so transform scalar (string) into an array
                    // so we can add the duplicates
                    $parsed_parameters[$parameter] = array($parsed_parameters[$parameter]);
                }
                $parsed_parameters[$parameter][] = $value;
            } else {
                $parsed_parameters[$parameter] = $value;
            }
        }
        return $parsed_parameters;
    }    

    public function http_req($url, $parameters=array(), $referer='') {
         // Convert the data array into URL Parameters like a=b&foo=bar etc.
        $data = $this->buildQueryString($parameters);
     
        // parse the given URL
        $url = parse_url($url);
     
        // extract host and path:
        $host = $url['host'];
        $path = $url['path'];
        $query = $url['query'];
        // open a socket connection on port 80 - timeout: 30 sec
        $fp = fsockopen($host, 80, $errno, $errstr, 30);
     
        if ($fp){
     
            // send the request headers:
            fputs($fp, "POST $path?".(strlen($query)?$query:"")." HTTP/1.1\r\n");
            fputs($fp, "Host: $host\r\n");
     
            if ($referer != '')
                fputs($fp, "Referer: $referer\r\n");
     
            fputs($fp, "Content-type: application/x-www-form-urlencoded\r\n");
            fputs($fp, "Content-length: ". strlen($data) ."\r\n");
            fputs($fp, "Connection: close\r\n\r\n");
            fputs($fp, $data);
     
            $result = ''; 
            while(!feof($fp)) {
                // receive the results of the request
                $result .= fgets($fp, 128);
            }
        }
        else { 
            return array(
                'status' => 'err', 
                'error' => "$errstr ($errno)"
            );
        }
     
        // close the socket connection:
        fclose($fp);
     
        // split the result header from the content
        $result = explode("\r\n\r\n", $result, 2);
     
        $this->http_info['header'] = isset($result[0]) ? $result[0] : '';
        $response = isset($result[1]) ? $result[1] : '';
     
        // return as structured array:
        return $response;      
    }
    
    /**
     * URL en- and decoding
     */  
    public function urlEncode($data) {
        if (is_array($data)) {
            return array_map(array($this, 'urlEncode'), $data);
        } else if (is_scalar($data)) {
            return str_replace("+", " ", str_replace("%7E", "~", rawurlencode($data)));
        } else {
            return "";
        }
    }
    public function urlDecode($string) {
        return urldecode($string);
    }
    /**
     * Build http query
     */
    public function buildQueryString($params) {
        if (!$params) return '';
    
        // Urlencode both keys and values
        $keys = $this->urlEncode(array_keys($params));
        $values = $this->urlEncode(array_values($params));
        $params = array_combine($keys, $values);
    
        uksort($params, 'strcmp');
    
        $pairs = array();
        foreach ($params as $k => $v) {
            if (is_array($v)) {
                // If two or more parameters share the same name, they are sorted by their value
                natsort($v);
                foreach ($v as $duplicate) {
                    $pairs[] = $k . '=' . $duplicate;
                }
            } else {
                $pairs[] = $k . '=' . $v;
            }
        }
        return implode('&', $pairs);
    }  

}
?>