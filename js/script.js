$(window).on('load', function() {
    $('#loading').hide();
});

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})

$("#countrySearchForm").submit(function(e) {
    e.preventDefault();
});