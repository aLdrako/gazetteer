// Variables
let countryFeature = undefined; // used for saving map feature (geojson, coords, layer, etc.)
let markers = []; // used to hold city markers
let curCountry = undefined; // used as switch to avoid fetching data if the same country is selected
let searchBy = "click"; // used as a switch when searching country by map click, search field or geolocation

accessToken =
  "pk.eyJ1IjoicmF6aWVsYWthYWxpZW4iLCJhIjoiY2tmOXppMmF0MHI3MjMwbGN2MG45bjJmeiJ9.HCBIa2UlWQUn9h5q7aOq_Q";
mapboxUrl =
  "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}";
mapboxAttribution =
  'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

// Mapbop layers
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

// Defining popup options, style
let popUpOptionsCity = {
  className: "popupCity",
};

let popUpOptionsCapital = {
  className: "popupCapital",
};

// Defining custom markers - Leaflet.ExtraMarkers
let cityMarker = L.ExtraMarkers.icon({
  icon: "fa-building",
  iconColor: "white",
  markerColor: "#333",
  prefix: "fa",
  svg: true,
});

let capitalMarker = L.ExtraMarkers.icon({
  icon: "fa-city",
  iconColor: "#333",
  markerColor: "white",
  shape: "square",
  prefix: "fa",
  svg: true,
});

// Initializing map
let myMap = L.map("mapId", { layers: [streets] }).setView([51.505, -0.09], 5);

// Adding layer change controls
L.control.layers(mapboxLayers).addTo(myMap);

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

// Get country by geolocation
const locationSuccess = (obj) => {
  let coords = obj.coords;
  searchBy = "geolocation";
  getCountryData(coords);
};

const locationError = (err) => {
  console.warn(`${err.code}: ${err.message}`);
};

let options = {
  enableHighAccuracy: false,
  timeout: 5000,
  maximumAge: 0,
};

navigator.geolocation.getCurrentPosition(
  locationSuccess,
  locationError,
  options
);

// Handle event on map click
const getCountryData = async (e) => {
  let countryCodeA3,
    countryCodeA2,
    currency,
    citiesCoords,
    citiesPopulation,
    citiesNames,
    covidData,
    feature;

  if (searchBy == "click") {
    countryCodeA3 = await getGeocodeData(e.latlng.lat, e.latlng.lng);
  } else if (searchBy == "search") {
    countryCodeA3 = await searchCountry(e); // passing country name
    searchBy = "click";
  } else if (searchBy == "geolocation") {
    countryCodeA3 = await getGeocodeData(e.latitude, e.longitude);
    searchBy = "click";
  }

  if (curCountry == countryCodeA3) {
    toggleSpinner(false);
  }

  // Proceed only if new country is selected (exclude the same country or undefined)
  if (curCountry != countryCodeA3 && countryCodeA3 != undefined) {
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
      covidData = await getCovidData(countryCodeA3);
    } catch (err) {
      console.log(err);
    }

    try {
      feature = await getCountryFeature(countryCodeA3);
    } catch (err) {
      console.log(err);
    }

    // Clearing previously selected outlines, markers, etc.
    resetDetails(countryFeature, markers);

    // Get currency data
    getCurrency(currency);

    // Setting country outline
    countryFeature = L.geoJSON(feature, {
      style: layerStyle,
      onEachFeature,
    }).addTo(myMap);

    addMarkers(citiesNames, citiesCoords, citiesPopulation);

    curCountry = countryCodeA3;
  }

  // Toggle visibility of content with country info
  $("#collapseCountryInfo").collapse("show");
};

// Get country on map click
myMap.on("click", getCountryData);

// Get country by search field
$("#countrySearch").on("change", () => {
  searchBy = "search";
  getCountryData($(`#countrySearch`).val());
});

// Get country feature for outline
const getCountryFeature = async (codeA3) => {
  if (codeA3 != undefined) {
    toggleSpinner(true);
  }
  let data = await fetch(
    `/Projects/Gazetteer/php/getCountryFeature.php?code=${codeA3}`
  );
  let json = await data.json();

  return json;
};

// Get country code using search field
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
    console.log("Error > ", err);
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
    console.log("Error > ", err);
  }
};

// Get country info
const getCountryInfo = async (codeA3) => {
  try {
    let data = await fetch(`php/countryInfo.php?country=${codeA3}`);
    if (data.ok) {
      let json = await data.json();

      let countryCodeA2 = json.alpha2Code;
      let population = json.population != null ? json.population : "No data";
      let currency = json.currencies[0]["code"];
      let capital = json.capital;
      let flag = json.flag;
      let countryName = json.name;
      let area = json.area != null ? json.area : "No data";

      $("#countryName").html(countryName);
      $("#capital").html(capital);
      $("#population").html(numberWithCommas(population));
      $("#area").html(numberWithCommas(area));
      $("#countryFlag").attr("src", flag);

      $(`#countrySearch`).val(countryName);

      return {
        countryCodeA2,
        currency,
      };
    } else {
      throw "No response from the server!";
    }
  } catch (err) {
    console.log("Error > ", err);
  }
};

// Get cities list with details
const getCountryCities = async (codeA2) => {
  try {
    let data = await fetch(`php/countryCities.php?country=${codeA2}`);
    if (data.ok) {
      let json = await data.json();

      let citiesNames = json.citiesNames;
      let citiesPopulation = json.citiesPopulation;
      let citiesCoords = json.citiesCoords;

      return { citiesCoords, citiesPopulation, citiesNames };
    } else {
      throw "No response from the server!";
    }
  } catch (err) {
    console.log("Error > ", err);
  }
};

// Get current weather of the city/capital and coordinates
const getWeather = async (lat, lng) => {
  try {
    let data = await fetch(`php/weather.php?lat=${lat}&lng=${lng}`);
    if (data.ok) {
      let json = await data.json();
      let temp = json.current.temp;
      let humidity = json.current.humidity;
      let wind = json.current.wind_speed;
      let icon = json.current.weather[0].icon;
      return { temp, humidity, wind, icon };
    } else {
      throw "No response from the server!";
    }
  } catch (err) {
    console.log("Error > ", err);
  }
  return 100;
};

// Get currency and exchange rate for selected country
const getCurrency = async (cur) => {
  try {
    let data = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=10ce25eb301844099947e618271e570e`
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
    console.log("Error > ", err);
  }
};

// Get current data of covid cases in specific country
const getCovidData = async (codeA3) => {
  try {
    let data = await fetch(`php/covid.php?country=${codeA3}`);
    if (data.ok) {
      let json = await data.json();
      let confirmed = json.confirmed;
      let active = json.active;
      let recovered = json.recovered;
      let deaths = json.deaths;
      let difference = json.confirmed_diff;

      $("#confirmedCovid").html(numberWithCommas(confirmed));
      $("#activeCovid").html(numberWithCommas(active));
      $("#recoveredCovid").html(numberWithCommas(recovered));
      $("#deathsCovid").html(numberWithCommas(deaths));
      $("#differenceCovid").html(numberWithCommas(`+${difference}`));

      return json;
    } else {
      throw "No response from the server!";
    }
  } catch (err) {
    console.log("Error > ", err);
  }
};

// Get famous places ids located in capital
const getPlacesId = async (lat, lng) => {
  try {
    toggleSpinnerGrow(true);
    let data = await fetch(`php/openTripMap.php?lon=${lng}&lat=${lat}`);
    if (data.ok) {
      let json = await data.json();
      let i = 0;

      while (i < json.xid.length) {
        await getPlacesInfo(json.xid[i], i);
        i++;
      }

      if (json.xid.length >= 1) {
        toggleSpinnerGrow(false);
      } else {
        toggleSpinnerGrow(false);
        $('.modal-body').css('height', 'auto');
        $("#carousel-inner").append(`
        <div class="carousel-item active text-center">No famous places found <i class="far fa-frown"></i></div>
        `);
      }
    } else {
      throw "No response from the server!";
    }
  } catch (err) {
    console.log("Error > ", err);
  }
};

// Pass places ids to get detailed info about those places
const getPlacesInfo = async (id, i) => {
  try {
    let data = await fetch(`php/openTripMapXid.php?xid=${id}`);
    if (data.ok) {
      let json = await data.json();

      let name = json.name;
      let preview = json.preview;
      let link = json.link;
      let text = json.text;

      let activeClass = i == 0 ? "carousel-item active" : "carousel-item";

      $("#carousel-inner").append(`
        <div class="${activeClass}">
            <a class="item-link" href="${link}" target="_blank"><button type="button" class="btn btn-outline-light">${name}</button></a><hr>
            <img style="max-width: 200px; max-height: 200px;" align="left" src="${preview}" class="align-self-center mr-3 img-thumbnail" alt="${name}">
            ${text}
        </div>
      `);
    } else {
      throw "No response from the server!";
    }
  } catch (err) {
    console.log("Error > ", err);
  }
};

// Adding city markers
const addMarkers = async (citiesNames, citiesCoords, citiesPopulation) => {
  let i = 0;
  let j = 0;
  let marker = undefined;

  try {
    // Populate only first 5 cities
    while (i < citiesNames.length && i < 5) {
      // Adding markers to map
      marker =
        i == 0
          ? L.marker(citiesCoords[i], { icon: capitalMarker })
          : L.marker(citiesCoords[i], { icon: cityMarker });
      marker.addTo(myMap);

      $(`#city-${i}`).html(citiesNames[i]);
      markers.push(marker);
      i++;
    }

    markers.forEach((marker) => {
      addPopup(marker, j, citiesNames[j], citiesCoords[j], citiesPopulation[j]);
      j++;
    });

    toggleSpinner(false);
  } catch (err) {
    console.log(err);
  }
};

// Binding popups with information to markers
const addPopup = async (marker, i, cityName, cityCoord, cityPopulation) => {
  let { temp, humidity, wind, icon } = await getWeather(
    cityCoord[0],
    cityCoord[1]
  );

  // Defining Popup style
  popUpOption = i == 0 ? popUpOptionsCapital : popUpOptionsCity;

  // Defining Popup message
  let popUpMsg = `
  <h5 class="text-center">${cityName}</h5>
  <hr class="my-1">
  <div class="media">
    <div class="media-body text-nowrap">
      <i class="fas fa-temperature-low" title="Temperature"> &ndash;</i> ${temp} °C <br>
      <i class="fas fa-tint" title="Humidity"></i><i class="fas fa-percentage fa-xs" title="Humidity"> &ndash;</i> ${humidity}% <br>
      <i class="fas fa-wind" title="Wind"> &ndash;</i> ${wind} m/s
    </div>
    <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Weather Icon">
  </div>
  <hr class="my-1">
  <i class="fas fa-user-friends" title="Population"> &ndash;</i> <b>${numberWithCommas(
    cityPopulation
  )}</b>
  <hr class="my-1">
  <button type="button" class="btn btn-link btn-sm popupCitiesPlaces" data-toggle="modal" data-target="#placesModal" data-lng=${
    cityCoord[0]
  } data-lat=${
    cityCoord[1]
  } id="popupCity-${i}"><i class="fas fa-landmark"> Famous places</i></button>
  `; // Adding @2x to img src makes weather icons bigger

  // Binding popups to markers with custom message and style and listening to openpopup event
  marker.bindPopup(popUpMsg, popUpOption).on("popupopen", function () {
    $(".popupCitiesPlaces").on("click", function () {
      let lng = $(this).attr("data-lng");
      let lat = $(this).attr("data-lat");
      $("#carousel-inner").html("");

      // Parsing data of interesting places
      getPlacesId(lng, lat);
    });
  });
  if (i == 0) {
    // Opens popup for Capital after adding all markers
    marker.openPopup();
  }
};

// Clearing previously selected outlines, markers, etc.
const resetDetails = (geojson, markers) => {
  if (geojson != undefined) {
    geojson.clearLayers();
    hover = true;
  }

  markers.forEach((element) => {
    if (element != undefined) element.remove();
  });

  markers.length = 0;

  for (let i = 0; i < 5; i++) {
    $(`#city-${i}`).html("");
  }
};

// Format big numbers
const numberWithCommas = (num) =>
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Open Leaflet Popup by clicking on cities buttons
$("#cities button").on("click", function () {
  let id = $(this).attr("id");
  try {
    if (id == "city-0") {
      markers[0].openPopup();
    }
    if (id == "city-1") {
      markers[1].openPopup();
    }
    if (id == "city-2") {
      markers[2].openPopup();
    }
    if (id == "city-3") {
      markers[3].openPopup();
    }
    if (id == "city-4") {
      markers[4].openPopup();
    }
  } catch (err) {
    console.log(err);
  }
});
