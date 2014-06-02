// UTILIITY FUNCTIONS
var showErr = function(xhr, status, err) {
    $('.alert-danger').fadeIn().find('.message').text(err);
  };
var showView = function(v){
	window.location.hash = '#' + v;
	$(".view").hide().filter('#' + v + '-view').show();
};