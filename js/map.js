// Variables
let hover = true; // used as a switch when fitting to bounds by mouse hover
let geojson = undefined;
let marker = undefined;
let locationMarker = undefined; // marker on location found
let locationArea = undefined; // selected area on location found

// Initializing map
let myMap = L.map('mapId').setView([51.505, -0.09], 5);

// Setting map layer
const setLayer = (styleLayer = 'mapbox/streets-v11') => {
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: styleLayer,
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoicmF6aWVsYWthYWxpZW4iLCJhIjoiY2tmOXppMmF0MHI3MjMwbGN2MG45bjJmeiJ9.HCBIa2UlWQUn9h5q7aOq_Q'
    }).addTo(myMap);
}

setLayer();

// Locate current position of device
myMap.locate({setView: false, maxZoom: 16});

// Handling event on location found
const onLocationFound = e => {
    let radius = e.accuracy;

    locationMarker = L.marker(e.latlng).addTo(myMap)
        .bindPopup(`Your are within ${radius} meters from this point`)
        .openPopup();
    
    locationArea = L.circle(e.latlng, {
        color: 'rgb(255, 102, 0)',
        fillColor: 'rgb(255, 102, 0)',
        fillOpacity: 0.5,
        radius
    }).addTo(myMap);
}

myMap.on('locationfound', onLocationFound);

// if geo failed
const onLocationError = e => {
    alert(e.message);
}

myMap.on('locationerror', onLocationError);


// Fit selected country to bounds
// fit on hover
const fitMapBoundsOnHover = e => {
    if (hover) {
        myMap.fitBounds(e.target.getBounds());
    }
    hover = false;
}

// fit on click
const fitMapBoundsOnClick = e => {
    myMap.fitBounds(e.target.getBounds());
}

const onEachFeature = (feature, layer) => {
    layer.on({
        mouseover: fitMapBoundsOnHover,
        click: fitMapBoundsOnClick
    });
}

// Handle event on map click
const onMapClick = async (e) => {
    
    let { countryCodeA2, countryCodeA3 } = await getGeocodeData(e.latlng.lat, e.latlng.lng);

    let { population, currency, capital, flag, countryName } = await getCountryInfo(countryCodeA2);

    let { coord: cityCoord, population: cityPopulation } = await getCountryCities(countryCodeA2);

    let { temp } = await getWeather(cityCoord[0], cityCoord[1]);

    let feature = await getCountryLayer(countryCodeA3);

    getCurrency(currency);

    // Clearing previously selected outlines, markers, etc.
    resetDetails(geojson, marker, locationMarker, locationArea);

    // Setting country outline
    geojson = L.geoJson(feature, {
        style: {
            fillColor: 'rgb(0, 102, 255)',
            weight: 2,
            opacity: 0.6,
            color: 'rgb(255, 102, 0)',
            dashArray: '3',
            fillOpacity: 0.2
        },
        onEachFeature
    }).addTo(myMap);

    marker = L.marker(cityCoord).addTo(myMap);
    marker.bindPopup(`
        <b>Temp:  ${temp} °C</b><br>
        <b>Population: ${cityPopulation}</b>
        `);
}

myMap.on('click', onMapClick);

// Get core data from OpenCage
const getGeocodeData = async (lat, lng) => {

    let data = await fetch(`php/geocode.php?lat=${lat}&lng=${lng}`);
    let json = await data.json();

    let countryCodeA3 = json[0].components['ISO_3166-1_alpha-3'];
    let countryCodeA2 = json[0].components['ISO_3166-1_alpha-2'];

    return { countryCodeA2, countryCodeA3 };
}

// Get data for country outline
const getCountryLayer = async (codeA3) => {

    let data = await fetch(`./php/countries/countries_large.geo.json`);
    let json = await data.json();

    for (let key in json.features) {
        if (codeA3 === json.features[key].properties.ISO_A3) {
            return json.features[key];
        }
    }
}

// Get country info
const getCountryInfo = async (codeA2) => {

    let data = await fetch(`php/countryInfo.php?country=${codeA2}`);
    let json = await data.json();
    
    let population = json.population;
    let currency = json.currencies[0]['code'];
    let capital = json.capital;
    let flag = json.flag;
    let countryName = json.name;

    $('#capital').html(`Capital: <strong>${capital}</strong>`);
    $('#population').html(`Population: <strong>${population}</strong>`);

    return { population, currency, capital, flag, countryName };
}

// Get cities list with details
const getCountryCities = async (codeA2) => {

    let data = await fetch(`php/countryCities.php?country=${codeA2}`);
    let json = await data.json();
    let coord = [json[0]['lat'], json[0]['lng']];
    let population = json[0].population;

    return { coord, population };
}

// Get current weather of the city/capital and coordinates
const getWeather = async (lat, lng) => {

    let data = await fetch(`php/weather.php?lat=${lat}&lng=${lng}`);
    let json = await data.json();

    let temp = (json.current.temp - 273.15).toFixed(2);

    $('#weather').html(`Temperature: <strong>${temp}</strong>`);
    
    return { temp };
}

// Get currency and exchange rate for selected country
const getCurrency = async (cur) => {

    let data = await fetch(`https://openexchangerates.org/api/latest.json?app_id=9065944107c946019eff984d50954d33`);
    let json = await data.json();

    let currency = json.rates[cur];

    $('#currency').html(`Currency exchange rate: <strong>${(currency * 100).toFixed(3)}</strong> ${cur} = 100 USD`);

    return currency;
}

// Clearing previously selected outlines, markers, etc.
const resetDetails = (geojson, ...args) => {
    if (geojson != undefined) {
        geojson.clearLayers();
        hover = true;
    }
    
    args.forEach(element => {
        if (element != undefined) element.remove();
    });
}

// Changing style of map layer
$("#map-style").on('change', function() {

    mapboxStyleID = $(this).val();
    setLayer(mapboxStyleID);
    
});
