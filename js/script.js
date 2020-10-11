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
