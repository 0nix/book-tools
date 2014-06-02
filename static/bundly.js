// WORKFLOW
var addBook = function(bookCode, bundleid){
  ///api/bundle/:id/book/:pgid
  $.ajax({ 
    type: "PUT",
    url: "/api/bundle/"+bundleid+"/book/"+bookCode,
    accepts: 'application/json'
  }).then(function(data, status, xhr) {
    window.location.reload(true);
  },showErr);
  //$(".bundle-books #results").append("<li class='list-group-item'>"+bookCode+"+</li>");
};
var returnResults = function(id){
  $.ajax({
    type: 'GET',
    url: "/api/search/info/" +id,
    accepts: 'application/json'
    }).then(function(data, status, xhr) {
      $(".book-results #results").append("<li class='list-group-item'><p><a href='http://www.gutenberg.org/ebooks/"+data[0].value._id+"'>"+data[0].value.title+"</a></p><p> by "
          +data[0].value.author+"</p><p><a class='bookitem' href='b-"+data[0].value._id+"'><button class='btn btn-primary'><abbr class='glyphicon glyphicon-plus' title='Add Book'><span>Add Book</abbr></button></a></p></li>");
    }, showErr);
};
//LISTENERS
$(".book-results #results").on("click", ".bookitem", function(event){
  event.preventDefault();
  var code = event.currentTarget.href.split("b-")[1];
  var id = event.currentTarget.baseURI.split("?")[0].split("http://")[1].split("/")[1];
  addBook(code, id);
});
$('.find-book.by-title .search').typeahead({
  name: 'subject',
  limit: 10,
  remote: '/api/search/title?q=%QUERY'
});
$('.find-book.by-title').submit(function(event) {
  event.preventDefault();
  $(".book-results #results").empty();
  var searchTerm = encodeURIComponent($('.find-book.by-title .search').val());
  $.ajax({
    type: 'GET',
    url: "/api/search/book/title?q=" +searchTerm,
    accepts: 'application/json'
    }).then(function(data, status, xhr){
      // NO BOOKS
      if(data.length === 0) {
        // DO SOMETHING ABOUT THIS I DON'T KNOW.
      }
      else{
        for(var t in data){
          returnResults(data[t].value);
        }
      }
    }, showErr);
});
// WORFLOW
var start = function(){
$.ajax({ url:"/api/user", accepts: "application/json"})
	.then(function(data,status,xhr) {
    showView("edit-bundle");
	},function(xhr, status, err) {
		//showView("welcome");
	});
}
// STARTER
$(window).ready(start);