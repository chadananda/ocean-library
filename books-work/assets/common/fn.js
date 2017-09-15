// Demonstration of showing hidden footnotes on click
// Ocean formatted HTML

$(function() {
  $("a[data-fnid]").unbind().click(function(){
    // when selecting ids with periods, hashes or colons, escaping is required
    //var parent $(this).parent().attr('id');
    var id = ($(this).attr('data-fnid')).replace( /(\:|\.|\[|\])/g, "\\$1" );
    if ($('aside.fn[id=fn'+id+']')) id = '#fn' + id; else id = '#' + id; // support two styles of footnote id
    //console.log(id); 
    $(id).toggle();
    $(id).scrollintoview();
  });



})