<?php

$curl = curl_init();

curl_setopt_array($curl, array(
	CURLOPT_URL => "https://covid-19-statistics.p.rapidapi.com/reports?iso=" . $_REQUEST['country'],
	CURLOPT_RETURNTRANSFER => true,
	CURLOPT_FOLLOWLOCATION => true,
	CURLOPT_ENCODING => "",
	CURLOPT_MAXREDIRS => 10,
	CURLOPT_TIMEOUT => 30,
	CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
	CURLOPT_CUSTOMREQUEST => "GET",
	CURLOPT_HTTPHEADER => array(
		"x-rapidapi-host: covid-19-statistics.p.rapidapi.com",
		"x-rapidapi-key: d04b469266mshc93327bc9ae03b6p15cc90jsn9a819427ad80"
	),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

$decode = json_decode($response, true);	

$output = $decode['data'];

$data['confirmed'] = 0;
$data['active'] = 0;
$data['recovered'] = 0;
$data['deaths'] = 0;
$data['confirmed_diff'] = 0;

foreach($output as $key => $value) {
    $data['confirmed'] += $value['confirmed'];
    $data['active'] += $value['active'];
    $data['recovered'] += $value['recovered'];
    $data['deaths'] += $value['deaths'];
    $data['confirmed_diff'] += $value['confirmed_diff'];
}

header('Content-Type: application/json; charset=UTF-8');

if ($err) {
	echo "cURL Error #:" . $err;
} else {
    echo json_encode($data);
}
