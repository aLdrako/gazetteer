<?php

	include('openCage/AbstractGeocoder.php');
	include('openCage/Geocoder.php');

	$geocoder = new \OpenCage\Geocoder\Geocoder('da4197ec3f7642ed98c30a45eb622e9f');
 
	$result = $geocoder->geocode($_REQUEST['lat'] . ', ' . $_REQUEST['lng'], ['language' => 'en']);

	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($result['results']);

?>
