// Variables
let geojson = undefined;
let markers = [];
let curCountry = undefined; // used as switch to avoid fetching data if the same country is selected
let searchBy = "click"; // used as a switch when searching country from the search field
let selCountry = undefined; // selected country in search field

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

// Popup style
let popUpOptions = {
  maxWidth: "400",
  width: "200",
  className: "popupCustom",
};

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
  onMapClick(coords);
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
const onMapClick = async (e) => {
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
      feature = await getCountryLayer(countryCodeA3);
    } catch (err) {
      console.log(err);
    }

    // Clearing previously selected outlines, markers, etc.
    resetDetails(geojson, markers);

    // Get currency data
    getCurrency(currency);

    // Setting country outline
    geojson = L.geoJSON(feature, {
      style: layerStyle,
      onEachFeature,
    }).addTo(myMap);

    addMarkers(citiesNames, citiesCoords, citiesPopulation);

    // Get ids of famous places located in specific capital
    getPlacesId(citiesCoords[0][0], citiesCoords[0][1]);

    curCountry = countryCodeA3;
  }

  // Toggle visibility of content with country info
  $("#collapseCountryInfo").collapse("show");
};

// Get country on map click
myMap.on("click", onMapClick);

// Get country by search field
$("#countrySearch").on("change", () => {
  selCountry = $(`#countrySearch`).val();
  searchBy = "search";
  onMapClick(selCountry);
});

// Get data for country outlines
const getCountryLayer = async (codeA3) => {
  if (codeA3 != undefined) {
    toggleSpinner(true);
  }
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
      let population = json.population;
      let currency = json.currencies[0]["code"];
      let capital = json.capital;
      let flag = json.flag;
      let countryName = json.name;
      let area = json.area;

      $("#countryName").html(countryName);
      $("#capital").html(capital);
      $("#population").html(numberWithCommas(population));
      $("#area").html(numberWithCommas(area));
      $("#countryFlag").attr("src", flag);

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

      let activePercent = Math.round(100 / (confirmed / active));
      let recoveredPercent = Math.round(100 / (confirmed / recovered));
      let deathsPercent = Math.round(100 / (confirmed / deaths));

      $("#activeCovidBar")
        .width(`${activePercent}%`)
        .attr("aria-valuenow", activePercent);
      $("#recoveredCovidBar")
        .width(`${recoveredPercent}%`)
        .attr("aria-valuenow", recoveredPercent);
      $("#deathsCovidBar")
        .width(`${deathsPercent}%`)
        .attr("aria-valuenow", deathsPercent);

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
    let data = await fetch(`php/openTripMap.php?lon=${lng}&lat=${lat}`);
    if (data.ok) {
      let json = await data.json();
      let i = 0;

      while (i < json.xid.length) {
        await getPlacesInfo(json.xid[i], i);
        i++;
      }
      return json;
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
          <div class="media">
            <img style="height: 90px;" src="${preview}" class="align-self-center mr-3 img-thumbnail" alt="${name}">
            <div class="media-body" style="height: 90px;">
              <h5 class="my-0"><a href="${link}" target="_blank">${name}</a></h5>
              <p style="font-size: .9rem;">${text}</p>
            </div>
          </div>
        </div>
      `);

      return json;
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
  let marker = undefined;

  try {
    while (i < citiesNames.length && i < 5) {
      // Populate only first 5 cities
      if (citiesCoords.length != 1) {
        let { temp, humidity, wind, icon } = await getWeather(
          citiesCoords[i][0],
          citiesCoords[i][1]
        );
        let capital = i == 0 ? `<small class="text-muted">Capital</small>` : ``;
        let popUpMsg = `
        <h5>${citiesNames[i]} ${capital}</h5>
        <hr class="my-1">
        <div class="media" id="popupCustom">
          <div class="media-body text-nowrap">
              <span class="badge badge-light">Temp</span> ${temp} °C <br>
              <span class="badge badge-light">Humidity</span> ${humidity}% <br>
              <span class="badge badge-light">Wind</span> ${wind} m/s
          </div>
          <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Weather Icon">
        </div>
        <hr class="my-1">
        Population: <b>${numberWithCommas(citiesPopulation[i])}</b>
        `; // @2x
        marker = L.marker(citiesCoords[i]).addTo(myMap);
        marker.bindPopup(popUpMsg, popUpOptions);

        $(`#city-${i}`).html(citiesNames[i]);
        markers.push(marker);
        i++;
      } else {
        i++;
      }
    }
    toggleSpinner(false);
  } catch (err) {
    console.log(err);
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

  $("#carousel-inner").html("");
  for (let i = 0; i < 5; i++) {
    $(`#city-${i}`).html("");
  }
};

// Format big numbers
const numberWithCommas = (num) =>
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

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
