<?php

	$url='https://api.opentripmap.com/0.1/en/places/radius?radius=15000&lon=' . $_REQUEST['lon'] . '&lat=' . $_REQUEST['lat'] . '&kinds=interesting_places&src_geom=wikidata&src_attr=wikidata&rate=3h&format=json&limit=7&apikey=5ae2e3f221c38a28845f05b630f757a20fd6542940e20a3a2e9e9935';

    $ch = curl_init();
    
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL, $url);

	$result = curl_exec($ch);

	curl_close($ch);

    $decode = json_decode($result, true);
    
    $xid = [];

    foreach($decode as $key => $value) {
        array_push($xid, $value['xid']);
    }

    $output['xid'] = $xid;
	
	header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($output);
?>