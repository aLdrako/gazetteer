<?php

	$url='https://api.opentripmap.com/0.1/en/places/xid/' . $_REQUEST['xid'] . '?apikey=5ae2e3f221c38a28845f05b630f757a20fd6542940e20a3a2e9e9935';

    $ch = curl_init();
    
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL, $url);

	$result = curl_exec($ch);

	curl_close($ch);

    $decode = json_decode($result, true);

    $output['name'] = $decode['name'];
    $output['preview'] = $decode['preview']['source'];
    $output['link'] = $decode['wikipedia'];
    $output['text'] = $decode['wikipedia_extracts']['text'];

    $image_url = $decode['preview']['source'];
    
    $image_type_check = @exif_imagetype($image_url);
    
    if (strpos($http_response_header[0], "403") || strpos($http_response_header[0], "404") || strpos($http_response_header[0], "302") || strpos($http_response_header[0], "301")) {
        $output['preview'] = 'https://alexgo.co.uk/Projects/Gazetteer/images/no-image.png';
    } else {
        $output['preview'] = $decode['preview']['source'];
    }
	
	header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($output);
?>