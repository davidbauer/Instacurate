<?php
require_once('./embed-cache.class.php');

if($_GET['url']) {
    $urls = $_GET['url'];
    $params = array_merge([], $_GET);
    $output = array();
    $errors = array();
    $embedcache = new embedcache();
    if(!is_array($urls)) $urls = array($urls);
    unset($params['url']);
    foreach($urls as $url) {
        if(($json = $embedcache->getEmbed($url, $params))) {
            $output[] = $json;
        } else {
            $output[] = 0;
            $errors[] = '{ "error": "' . $embed->error .'" }';
        }
    }
    header('Content-type: application/json');
    printf('{ "cache": [ %s ], "errors": [ %s ] }', implode(', ', $output), implode(', ', $errors));
} else {
    $embedcache = new embedcache();
    $embedcache->cleanUp();
}

?>