
// ACCESS TOKENS
let mapboxToken = 'pk.eyJ1IjoicmF6aWVsYWthYWxpZW4iLCJhIjoiY2tmOXppMmF0MHI3MjMwbGN2MG45bjJmeiJ9.HCBIa2UlWQUn9h5q7aOq_Q';
let openExchangeID = '9065944107c946019eff984d50954d33';
// let openWeatherAPI = '1e3549b78a475f10c001652bfc9b802a';

// MAPBOX STYLE
// https://docs.mapbox.com/api/maps/#styles
// let mapboxStyle = [
//     'streets-v11',
//     'outdoors-v11',
//     'light-v10',
//     'dark-v10',
//     'satellite-v9',
//     'satellite-streets-v11'
// ];
let mapboxStyleID = 'streets-v11';

// INITIALIZING MAP
// let myMap = L.map('mapId').setView([51.505, -0.09], 5);

let myMap = L.map('mapId').fitWorld();

// LOCATE POSITION - used to locate current position of device
myMap.locate({setView: true, maxZoom: 16});

// CREATING TILE LAYER
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: `mapbox/${mapboxStyleID}`,
    tileSize: 512,
    zoomOffset: -1,
    accessToken: mapboxToken
}).addTo(myMap);


$("#map-style").on('change', function() {

    mapboxStyleID = $(this).val();

        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: `mapbox/${mapboxStyleID}`,
        tileSize: 512,
        zoomOffset: -1,
        accessToken: mapboxToken
    }).addTo(myMap);
    
});


// HANDLING EVENT ON LOCATION FOUND
const onLocationFound = e => {
    let radius = e.accuracy;

    L.marker(e.latlng).addTo(myMap)
        .bindPopup(`Your are within ${radius} meters from this point`).openPopup();
    
    L.circle(e.latlng, {
        color: 'rgb(255, 102, 0)',
        fillColor: 'rgb(255, 102, 0)',
        fillOpacity: 0.5,
        radius
    }).addTo(myMap);
}

myMap.on('locationfound', onLocationFound);

// HADLING ERROR MESSAGE IF GEOLOCATION FAILED
const onLocationError = e => {
    alert(e.message);
}

myMap.on('locationerror', onLocationError);

// HANDLING EVENT ON CLICK

const style = feature => {
    return {
        fillColor: 'rgb(0, 102, 255)',
        weight: 2,
        opacity: 0.6,
        color: 'rgb(255, 102, 0)',
        dashArray: '3',
        fillOpacity: 0.2
    };
}

const zoomToFeature = (e) => {
    myMap.fitBounds(e.target.getBounds());
}

const onEachFeature = (feature, layer) => {
    layer.on({
        mouseover: zoomToFeature
    });
}

let geojson;

// let popupClick = L.popup();

const onMapClick = async (e) => {
    // popupClick
    //     .setLatLng(e.latlng)
    //     .setContent(`You clicked the map at ${e.latlng}`)
    //     .openOn(myMap); // instead of addTo

    // Getting Country ID
    $.ajax({
        url: "php/countries.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lat: e.latlng.lat,
            lng: e.latlng.lng
        },
        
        beforeSend: function() {
          $('#loading-image-spinner').show();  
        },
        complete: function() {
          $('#loading-image-spinner').hide();
        },

        success: async function(result) {
    
            // console.log(result.data.countryCode);

            // Adding country layer
            $.getJSON('./vendor/countries/countries_large.geo.json', function(json) {
                $.each(json.features, function(key, value) {
                    
                    if (getCountryCode(result.data.countryCode) == json.features[key].properties.ISO_A3) {
                        // console.log('Key: ' + key);
                        // console.log('Value: ' + value);
                        // console.log(value.properties.ADMIN);
                        
                        // Clearing previously selected layer
                        if (geojson != undefined) {
                            geojson.clearLayers();
                        }

                        geojson = L.geoJson(value, {
                            style,
                            onEachFeature
                        }).addTo(myMap);

                        // getCountryLayer(result.data.countryCode);
                    }
                });
            });

            // console.log(result.data.countryCode);

            

            

            
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    }); 

    let { countryCodeA2, countryCodeA3 } = await getGeocodeData(e.latlng.lat, e.latlng.lng);

    let { capital, currency } = await getCountryInfo(countryCodeA2);
    
    let feature = await getCountryLayer(countryCodeA3);

    getWeather(capital);

    getCurrency(currency);
    
}

const getGeocodeData = async (lat, lng) => {

    let data = await fetch(`php/geocode.php?lat=${lat}&lng=${lng}`);
    let json = await data.json();

    let countryCodeA3 = json[0].components['ISO_3166-1_alpha-3'];
    let countryCodeA2 = json[0].components['ISO_3166-1_alpha-2'];

    return { countryCodeA2, countryCodeA3, json };
}

const getCountryLayer = async (code) => {

    let data = await fetch(`./vendor/countries/countries_large.geo.json`);
    let json = await data.json();

    for (let key in json.features) {
        if (code === json.features[key].properties.ISO_A3) {
            return json.features[key];
        }
    }
}

const getCountryInfo = async (code) => {

    let data = await fetch(`php/countryInfo.php?country=${code}`);
    let json = await data.json();
    
    let capital = json.geonames[0].capital;
    let population = json.geonames[0].population;
    let currency = json.geonames[0].currencyCode;

    $('#capital').html(`Capital: <strong>${capital}</strong>`);
    $('#population').html(`Population: <strong>${population}</strong>`);

    return { capital, currency, json };
}

const getWeather = async (city) => {

    let data = await fetch(`php/weather.php?city=${city}`);
    let json = await data.json();

    let temp = (json.main.temp - 273.15).toFixed(2);

    $('#weather').html(`Temperature: <strong>${temp}</strong>`);

    return json;
}

const getCurrency = async (cur) => {

    let data = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${openExchangeID}`);
    let json = await data.json();

    let currency = json.rates[cur];

    $('#currency').html(`Currency: <strong>${(currency * 100).toFixed(3)}</strong> ${cur} = 100 USD`);

    return json;
}


myMap.on('click', onMapClick);

const getCountryCode = code => {
    const iso3 = ['AFG','ALA','ALB','DZA','ASM','AND','AGO','AIA','ATA','ATG','ARG','ARM','ABW','AUS','AUT','AZE','BHS','BHR','BGD','BRB','BLR','BEL','BLZ','BEN','BMU','BTN','BOL','BIH','BWA','BVT','BRA','IOT','VGB','BRN','BGR','BFA','BDI','KHM','CMR','CAN','CPV','CYM','CAF','TCD','CHL','CHN','CXR','CCK','COL','COM','COG','COD','COK','CRI','CIV','HRV','CUB','CYP','CZE','DNK','DJI','DMA','DOM','ECU','EGY','SLV','GNQ','ERI','EST','ETH','FLK','FRO','FJI','FIN','FRA','GUF','PYF','ATF','GAB','GMB','GEO','DEU','GHA','GIB','GRC','GRL','GRD','GLP','GUM','GTM','GGY','GIN','GNB','GUY','HTI','HMD','VAT','HND','HKG','HUN','ISL','IND','IDN','IRN','IRQ','IRL','IMN','ISR','ITA','JAM','JPN','JEY','JOR','KAZ','KEN','KIR','PRK','KOR','KWT','KGZ','LAO','LVA','LBN','LSO','LBR','LBY','LIE','LTU','LUX','MAC','MKD','MDG','MWI','MYS','MDV','MLI','MLT','MHL','MTQ','MRT','MUS','MYT','MEX','FSM','MDA','MCO','MNG','MNE','MSR','MAR','MOZ','MMR','NAM','NRU','NPL','NLD','ANT','NCL','NZL','NIC','NER','NGA','NIU','NFK','MNP','NOR','OMN','PAK','PLW','PSE','PAN','PNG','PRY','PER','PHL','PCN','POL','PRT','PRI','QAT','REU','ROU','RUS','RWA','SHN','KNA','LCA','SPM','VCT','BLM','MAF','WSM','SMR','STP','SAU','SEN','SRB','SYC','SLE','SGP','SVK','SVN','SLB','SOM','ZAF','SGS','SSD','ESP','LKA','SDN','SUR','SJM','SWZ','SWE','CHE','SYR','TWN','TJK','TZA','THA','TLS','TGO','TKL','TON','TTO','TUN','TUR','TKM','TCA','TUV','UGA','UKR','ARE','GBR','USA','URY','UMI','UZB','VUT','VEN','VNM','VIR','WLF','ESH','YEM','ZMB','ZWE'];
    const iso2 = ['AF','AX','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BA','BW','BV','BR','IO','VG','BN','BG','BF','BI','KH','CM','CA','CV','KY','CF','TD','CL','CN','CX','CC','CO','KM','CG','CD','CK','CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','ET','FK','FO','FJ','FI','FR','GF','PF','TF','GA','GM','GE','DE','GH','GI','GR','GL','GD','GP','GU','GT','GG','GN','GW','GY','HT','HM','VA','HN','HK','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MK','MG','MW','MY','MV','ML','MT','MH','MQ','MR','MU','YT','MX','FM','MD','MC','MN','ME','MS','MA','MZ','MM','NA','NR','NP','NL','AN','NC','NZ','NI','NE','NG','NU','NF','MP','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PN','PL','PT','PR','QA','RE','RO','RU','RW','SH','KN','LC','PM','VC','BL','MF','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','GS','SS','ES','LK','SD','SR','SJ','SZ','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TK','TO','TT','TN','TR','TM','TC','TV','UG','UA','AE','GB','US','UY','UM','UZ','VU','VE','VN','VI','WF','EH','YE','ZM','ZW'];
    if (code.length == 2) {
        return iso3[iso2.indexOf(code)];
    } else {
        return iso3[iso3.indexOf(code)];
    }
}

// const onClick = async (e) => {
    
// } 