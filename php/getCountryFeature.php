<?php

	$string = file_get_contents('countries/countries_large.geo.json');

	$array = json_decode($string, true);

	$output = $array['features'];
	$feature;

	foreach ($output as $key => $value) {
		if ($_REQUEST['code'] == $value['properties']['ISO_A3']) {
			$feature = $value;
		}
	}
	
	header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($feature);
?>