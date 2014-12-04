<?php
require_once('./embed-cache.class.php');
if($_GET['url']) {
    $url = '';
    $params = array();
    foreach($_GET as $k=>$v) {
        if($k == 'url') {
            $url = $v;
        } else {
            $params[$k] = $v;
        }
    }
    $embedcache = new embedcache();
    header('Content-type: application/json');
    if(($output = $embedcache->getEmbed($url, $params))) {
        echo $output;
    } else {
        echo '{ "error": "' . $embed->error .'" }';
    }
} else {
    $embedcache = new embedcache();
    $embedcache->cleanUp();
}

?>