// Variables
let geojson = undefined;
let markers = [];
let locationMarker = undefined; // marker on location found
let locationArea = undefined; // selected area on location found
let curCountry = undefined; // used as switch to avoid fetching data if the same country is selected
let search = false; // used as a switch when searching country from the search field
let selCountry = undefined; // selected country in search field

accessToken =
  "pk.eyJ1IjoicmF6aWVsYWthYWxpZW4iLCJhIjoiY2tmOXppMmF0MHI3MjMwbGN2MG45bjJmeiJ9.HCBIa2UlWQUn9h5q7aOq_Q";
mapboxUrl =
  "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}";
mapboxAttribution =
  'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

let streets = L.tileLayer(mapboxUrl, {
    id: "mapbox/streets-v11",
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 18,
    minZoom: 2,
    attribution: mapboxAttribution,
    accessToken,
  }),
  strSatellite = L.tileLayer(mapboxUrl, {
    id: "mapbox/satellite-streets-v11",
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 18,
    minZoom: 2,
    attribution: mapboxAttribution,
    accessToken,
  }),
  satellite = L.tileLayer(mapboxUrl, {
    id: "mapbox/satellite-v9",
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 18,
    minZoom: 2,
    attribution: mapboxAttribution,
    accessToken,
  });

let mapboxLayers = {
  Streets: streets,
  Satellite: satellite,
  "Streets Satellite": strSatellite,
};

// Outline layer style
let layerStyle = {
  fillColor: "rgb(0, 102, 255)",
  weight: 2,
  opacity: 0.6,
  color: "rgb(255, 102, 0)",
  dashArray: "3",
  fillOpacity: 0.2,
};

// Circle layer style on location found
let locationAreaStyle = {
  color: "rgb(255, 102, 0)",
  fillColor: "rgb(255, 102, 0)",
  fillOpacity: 0.5,
};

// New icon for current location marker
let locationIcon = L.icon({
  iconUrl: "./vendor/leaflet/images/location-marker-icon.png",
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [-1, -36],
});

// Initializing map
let myMap = L.map("mapId", { layers: [streets] }).setView([51.505, -0.09], 5);
L.control.layers(mapboxLayers).addTo(myMap);

// Locate current position of device
myMap.locate({ setView: false, maxZoom: 16 });

// Handling event on location found
const onLocationFound = (e) => {
  let radius = e.accuracy;

  locationMarker = L.marker(e.latlng, { icon: locationIcon })
    .addTo(myMap)
    .bindPopup(`Your are within ${radius} meters from this point`)
    .openPopup();

  locationArea = L.circle(e.latlng, locationAreaStyle, radius).addTo(myMap);
};

myMap.on("locationfound", onLocationFound);

// If location found failed
const onLocationError = (e) => {
  alert(e.message);
};

myMap.on("locationerror", onLocationError);

// Fit selected country to bounds
const fitMapBoundsOnClick = (e) => {
  myMap.fitBounds(e.target.getBounds());
};

const onEachFeature = (feature, layer) => {
  layer.on({
    click: fitMapBoundsOnClick,
  });

  myMap.fitBounds(layer.getBounds());
};

// Handle event on map click
const onMapClick = async (e) => {
  let countryCodeA3,
    countryCodeA2,
    currency,
    citiesCoords,
    citiesPopulation,
    citiesNames,
    feature;

  if (!search) {
    countryCodeA3 = await getGeocodeData(e.latlng.lat, e.latlng.lng);
  } else {
    countryCodeA3 = await searchCountry(e); // passing country name
    search = false;
  }

  try {
    ({ countryCodeA2, currency } = await getCountryInfo(countryCodeA3));
  } catch (err) {
    console.log(err);
  }

  try {
    ({ citiesCoords, citiesPopulation, citiesNames } = await getCountryCities(
      countryCodeA2
    ));
  } catch (err) {
    console.log(err);
  }

  try {
    feature = await getCountryLayer(countryCodeA3);
  } catch (err) {
    console.log(err);
  }

  getCurrency(currency);

  if (curCountry != countryCodeA3) {
    // Clearing previously selected outlines, markers, etc.
    resetDetails(geojson, markers); // , locationMarker, locationArea - clear location info

    // Setting country outline
    geojson = L.geoJSON(feature, {
      style: layerStyle,
      onEachFeature,
    }).addTo(myMap);

    addMarkers(citiesNames, citiesCoords, citiesPopulation);

    curCountry = countryCodeA3;
  }

  $("#collapseCountryInfo").collapse("show");
};

// Get country on map click
myMap.on("click", onMapClick);

// Get country by search field
$("#countrySearch").on("change", () => {
  selCountry = $(`#countrySearch`).val();
  search = true;
  onMapClick(selCountry);
});

// Get data for country outlines
const getCountryLayer = async (codeA3) => {
  let data = await fetch(`./php/countries/countries_large.geo.json`);
  let json = await data.json();

  for (let key in json.features) {
    if (codeA3 === json.features[key].properties.ISO_A3) {
      return json.features[key];
    }
  }
};

// Populate datalist with countries
const getCountryList = async () => {
  let data = await fetch("./php/countries/countries_small.geo.json");
  let json = await data.json();

  for (let key in json.features) {
    let countryName = json.features[key].properties.name;
    $("#countryList").append(`<option value="${countryName}">`);
  }
};

getCountryList();

const searchCountry = async (country) => {
  try {
    let data = await fetch(`php/searchCountry.php?country=${country}`);
    if (data.ok) {
      let json = await data.json();
      let countryCodeA3 = json[0].alpha3Code;
      return countryCodeA3;
    } else {
      throw "No response from the server!";
    }
  } catch (err) {
    console.log("Wrong data passed. More details > ", err);
  }
};

// Get core data from OpenCage
const getGeocodeData = async (lat, lng) => {
  try {
    let data = await fetch(`php/geocode.php?lat=${lat}&lng=${lng}`);
    if (data.ok) {
      let json = await data.json();
      let countryCodeA3 = json[0].components["ISO_3166-1_alpha-3"];
      return countryCodeA3;
    } else {
      throw "No response from the server!";
    }
  } catch (err) {
    console.log("Wrong data passed. More details > ", err);
  }
};

// Get country info
const getCountryInfo = async (codeA3) => {
  try {
    let data = await fetch(`php/countryInfo.php?country=${codeA3}`);
    if (data.ok) {
      let json = await data.json();

      let countryCodeA2 = json.alpha2Code;
      let population = json.population;
      let currency = json.currencies[0]["code"];
      let capital = json.capital;
      let flag = json.flag;
      let countryName = json.name;
      let area = json.area;

      $("#countryName").html(countryName);
      $("#capital").html(capital);
      $("#population").html(population);
      $("#area").html(area);
      $("#countryFlag").attr("src", flag);

      return {
        countryCodeA2,
        currency,
      };
    } else {
      throw "No response from the server!";
    }
  } catch (err) {
    console.log("Wrong data passed. More details > ", err);
  }
};

// Get cities list with details
const getCountryCities = async (codeA2) => {
  let data = await fetch(`php/countryCities.php?country=${codeA2}`);
  let json = await data.json();

  let capitalCoord = [],
    citiesCoords = [];
  let capitalPopulation = [],
    citiesPopulation = [];
  let capitalNames = [],
    citiesNames = [];

  json.forEach((el) => {
    if (el.fcode == "PPLC" && el.countryCode == codeA2) {
      // getting capital info
      capitalCoord = [el["lat"], el["lng"]];
      capitalPopulation = el.population;
      capitalNames = el.toponymName;
    } else if (
      el.fcode == "PPLA" ||
      (el.fcode == "PPLA2" && el.countryCode == codeA2)
    ) {
      // getting all other cities info
      citiesCoords.push([el["lat"], el["lng"]]);
      citiesPopulation.push(el.population);
      citiesNames.push(el.toponymName);
    }
  });

  citiesCoords.unshift(capitalCoord);
  citiesPopulation.unshift(capitalPopulation);
  citiesNames.unshift(capitalNames);

  return { citiesCoords, citiesPopulation, citiesNames };
};

// Get current weather of the city/capital and coordinates
const getWeather = async (lat, lng) => {
  try {
    let data = await fetch(`php/weather.php?lat=${lat}&lng=${lng}`);
    if (data.ok) {
      let json = await data.json();
      let temp = (json.current.temp - 273.15).toFixed(2);
      return temp;
    } else {
      throw "No response from the server!";
    }
  } catch (err) {
    console.log("Wrong data passed. More details > ", err);
  }
};

// Get currency and exchange rate for selected country
const getCurrency = async (cur) => {
  try {
    let data = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=9065944107c946019eff984d50954d33`
    );
    if (data.ok) {
      let json = await data.json();
      let currency = json.rates[cur];
      $("#currency").html(`${(currency * 100).toFixed(3)} ${cur}`);
      return currency;
    } else {
      throw "No response from the server!";
    }
  } catch (err) {
    console.log("Wrong data passed. More details > ", err);
  }
};

// Adding city markers
const addMarkers = async (citiesNames, citiesCoords, citiesPopulation) => {
  let i = 0;
  let marker = undefined;
  try {
    while (i < citiesNames.length && i < 3) { // Populate only first 3 cities
      if (citiesCoords.length != 1) {
        let temp = await getWeather(citiesCoords[i][0], citiesCoords[i][1]);
        marker = L.marker(citiesCoords[i]).addTo(myMap);
        marker.bindPopup(`
        <b>${citiesNames[i]}</b><br>
        Temp:  <b>${temp} °C</b><br>
        Population: <b>${citiesPopulation[i]}</b>
      `);
        i++;
        markers.push(marker);
      } else {
        i++;
      }
    }
  } catch (err) {
    console.log(err);
  }
};

// Clearing previously selected outlines, markers, etc.
const resetDetails = (geojson, markers, ...args) => {
  if (geojson != undefined) {
    geojson.clearLayers();
    hover = true;
  }

  markers.forEach((element) => {
    if (element != undefined) element.remove();
  });

  args.forEach((element) => {
    if (element != undefined) element.remove();
  });
};
