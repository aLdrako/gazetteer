$(window).on("load", function () {
  $("#loading").hide();
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});

$("#countrySearchForm").submit(function (e) {
  e.preventDefault();
});

$('#countrySearch').on('click', function (e) {
    $(this).val('');
});

function toggleSpinner(toggle) {
    !toggle ? $("#spinner").addClass("d-none") : $("#spinner").removeClass("d-none");
}

function toggleSpinnerGrow(toggle) {
  !toggle ? $("#spinner-grow").addClass("d-none") : $("#spinner-grow").removeClass("d-none");
}

let countryList = ["Afghanistan", "Albania", "Algeria", "Angola", "Antarctica", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bangladesh", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Falkland Islands", "Fiji", "Finland", "France", "French Guiana", "French Southern and Antarctic Lands", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Greenland", "Guatemala", "Guinea", "Guinea Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Lithuania", "Luxembourg", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Mali", "Malta", "Mauritania", "Mexico", "Moldova", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nepal", "Netherlands", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "Northern Cyprus", "Norway", "Oman", "Pakistan", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Qatar", "Republic of Serbia", "Republic of the Congo", "Romania", "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Sierra Leone", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "Somaliland", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Thailand", "The Bahamas", "Togo", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United Republic of Tanzania", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "West Bank", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"];

countryList.forEach((country) => {
  $("#countryList").append(`<option value="${country}">`);
});
