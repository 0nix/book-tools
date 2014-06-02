//LISTENERS 
$(window).on("hashchange",function(e){
	var view = (window.location.hash || "").replace(/^#/, '');
	if ($('#' + view + '-view').length) {
    showView(view);
    }
	});
$('.new-bundle-form').submit(function(event) {
  event.preventDefault();
  var name = $('#new-bundle-name').val();
  $.ajax({ url:"/api/user/bundles", accepts:"application/json"})
	.then(function(data, status, xhr){
	  var d = data;
    if(!d.hasOwnProperty("bundles"))
      d.bundles = {};
    $.ajax({
    type: 'POST',
    url: '/api/bundle?name=' + encodeURIComponent(name),
    accepts: 'application/json'
    }).then(function(data, status, xhr) {
    d.bundles[data.id] = name;
    console.log(d);
   $.ajax({
      type: 'PUT',
      url: '/api/user/bundles',
      data: JSON.stringify(d),
      contentType: 'application/json; charset=utf-8',
      accepts: 'application/json'
	  }).then(function(data, status, xhr){
	  	console.log(data);
	  	showBundleView();
	    }, showErr);
    }, showErr);
  }, 
  function(xhr, data, err){
    if(xhr.status === 404){
      var fdata = {};
      fdata.bundles = {};
      $.ajax({
      type: 'POST',
      url: '/api/bundle?name=' + encodeURIComponent(name),
      accepts: 'application/json'
      }).then(function(data, status, xhr) {
        fdata.bundles[data.id] = name;
        console.log(fdata);
        $.ajax({
        type: 'PUT',
        url: '/api/user/bundles',
        data: JSON.stringify(fdata),
        contentType: 'application/json; charset=utf-8',
        accepts: 'application/json'
    	  }).then(function(data, status, xhr){
    	  	showBundleView();
    	  	//console.log(data);
    	  }, showErr);
      },showErr);
    }
    else {showErr(xhr, xhr.status, err)}
  });
});
$('.find-book.by-author .search').typeahead({
  name: 'author',
  limit: 10,
  remote: '/api/search/author?q=%QUERY'
});
//WORKFLOW
var showBundleView = function(){
	showView("list-bundles");
	$(".bundles").empty();
	$.ajax({ url:"/api/user/bundles", accepts:"application/json"})
	.then(function(data, status, xhr){
		// DISPLAY THE DATA
		if(data.bundles === {} || !data.hasOwnProperty("bundles"))
		    $(".bundles").append("<p>No bundles found!</p>");
	    else{
	    $(".bundles").append("<ul class='list-group'>");
	    for(var key in data.bundles){
	         $(".bundles").append(" <li class='list-group-item'>"+data.bundles[key]+"  <a class='.edit-bundle' style='float: right;' href='/"+key+"'>Edit Bundle</a> </li>");
	     }
		}
	}, 
	function(xhr, data, err) {
	console.log(data);
	console.log(xhr);
	if(xhr.status === 404) $(".bundles").append("<p>No bundles found!</p>");
	else showErr(xhr, xhr.status, err);
	});
};
var start = function(){
$.ajax({ url:"/api/user", accepts: "application/json"})
	.then(function(data,status,xhr) {
		showBundleView();
	},function(xhr, status, err) {
		showView("welcome");
	});
}
// STARTER
$(window).ready(start);