<?php

	$url='https://alexgo.co.uk/Projects/Gazetteer/php/countries/countries_large.geo.json';

    $ch = curl_init();
    
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL, $url);

	$result = curl_exec($ch);

	curl_close($ch);	

	$decode = json_decode($result, true);	

	$output = $decode['features'];
	$feature;

	// Optimize with different search type, etc
	foreach ($output as $key => $value) {
		if ($_REQUEST['code'] == $value['properties']['ISO_A3']) {
			$feature = $value;
		}
	}
	
	header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($feature);
?>