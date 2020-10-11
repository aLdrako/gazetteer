<?php
    $url='http://api.geonames.org/searchJSON?country=' . $_REQUEST['country'] . '&maxRows=15&username=razielakaalien&style=LONG';
    
    $ch = curl_init();
    
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL, $url);

	$result = curl_exec($ch);

	curl_close($ch);

	$decode = json_decode($result, true);	

	$output = $decode['geonames'];

	$capitalName;
	$capitalPopulation;
	$capitalCoords = [];
	$citiesNames = [];
	$citiesPopulation = [];
	$citiesCoords = [];
	
	foreach ($output as $key => $val) {
		if ($val['fcode'] == 'PPLC' && $val['countryCode'] == $_REQUEST['country']) {
			$capitalName = $val['toponymName'];
			$capitalPopulation = $val['population'];
			$capitalCoords[0] = $val['lat'];
			$capitalCoords[1] = $val['lng'];
		} elseif ($val['fcode'] == 'PPLA' || $val['fcode'] == 'PPLA2' && $val['countryCode'] == $_REQUEST['country']) {
			array_push($citiesNames, $val['toponymName']);
			array_push($citiesPopulation, $val['population']);
			$temp[0] = $val['lat'];
			$temp[1] = $val['lng'];
			array_push($citiesCoords, $temp);
		}
	}

	array_unshift($citiesNames, $capitalName);
	array_unshift($citiesPopulation, $capitalPopulation);
	array_unshift($citiesCoords, $capitalCoords);

	$data['citiesNames'] = $citiesNames;
	$data['citiesPopulation'] = $citiesPopulation;
	$data['citiesCoords'] = $citiesCoords;

	header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($data);
?>