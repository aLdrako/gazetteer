<?php
    $url = 'https://api.openweathermap.org/data/2.5/onecall?lat=' . $_REQUEST['lat'] . '&lon=' . $_REQUEST['lng'] . '&units=metric&exclude=minutely,hourly,daily&appid=1e3549b78a475f10c001652bfc9b802a';

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL, $url);
    
    $result = curl_exec($ch);

    curl_close($ch);

    $decode = json_decode($result, true);	
	
	header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($decode);

?>