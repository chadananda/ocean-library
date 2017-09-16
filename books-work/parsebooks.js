// parsebooks.
// a script for generating a booklist and progress status
// requires jquery
// looks for a books.json file
// 
// 
if(window.location.protocol != 'https:') {
  var loc = location.href;
  if (loc.indexOf('http://')>-1 && loc.indexOf('github.io')>-1) location.href = loc.replace("http://", "https://");
}


// read the booklist
$( document ).ready(function() {
  $.getJSON("books-work/books.json", function( books ) {

    var summary = {
      total:0, words: 0, formatted:0, formatted_words:0,
      proofed:0, proofed_words:0,
      audio: 0, audio_words:0
    };

    var listing = {baha:[], bab:[], abd:[], shoghi:[], other:[]};

    $.each( books, function( key, book ) {
      // total up summaries
      summary.total ++; summary.words += book.words;
      if (book.formatted) {
        summary.formatted ++; summary.formatted_words += book.words;
      }
      if (book.proofed) {
        summary.proofed ++; summary.proofed_words += book.words;
      }
      if (book.audio) {
        summary.audio ++; summary.audio_words += book.words;
      }
      // add formatted item?
      var item='<li class="book"><a href="'+book.href+'" target="_blank">'+book.title+'</a> \n'+
        "<div class='book_details'> \n"+
          book.words.toLocaleString() +' words - '+
          (book.formatted ? "<span class='checked'> Formatted</span>" : "<span class='notchecked'> Not Formatted</span>") +" - "+
          (book.proofed ? "<span class='checked'> Proofread</span>" : "<span class='notchecked'> Not Proofread</span>") +" - "+
          (book.audio ? "<span class='checked'> Has Audio</span>" : "<span class='notchecked'> Needs Audio</span>") +"\n"+
        "</div></li>\n";

      if (/Bahá’u’lláh/.test(book.author)) listing.baha.push(item);
        else if (/The Báb/.test(book.author)) listing.bab.push(item);
        else if (/‘Abdu’l-Bahá/.test(book.author)) listing.abd.push(item);
        else if (/Shoghi Effendi/.test(book.author)) listing.shoghi.push(item);
        else listing.other.push(item);
    });
    summary.formatted_percent = Math.round(summary.formatted_words /  summary.words * 100) ;
    summary.proofed_percent = Math.round(summary.proofed_words /  summary.words * 100) ;
    summary.audio_percent = Math.round(summary.audio_words /  summary.words * 100) ;

    console.log(summary);

    //
    var report =  " <h1 class='section'> Progress Status: </h1> \n" +
     "  <h3> <b>"+ summary.total +"</b> Books - <b>"+summary.words.toLocaleString()+"</b> words </h3> \n"+
     "  <h4> Books Formatted: <b>"+ summary.formatted+ "</b> - <b>"+summary.formatted_words.toLocaleString()+
         "</b> words  (<b>"+summary.formatted_percent+"%</b>) <br/>\n"+
     "  Books Proofread: <b>"+summary.proofed+"</b> - <b>"+summary.proofed_words.toLocaleString()+
         "</b> words (<b>"+summary.proofed_percent+"%</b>) <br/>\n"+
     "  Books with Audio: <b>"+summary.audio+"</b> - <b>"+summary.audio_words.toLocaleString()+
         "</b> words  (<b>"+summary.audio_percent+"%</b>) \n"+
     "  </h4>";

     $("#prog_report").html(report);
     var list = '';

     list += "\n\n<h1 class='section'>Bahá’u’lláh</h1> \n";
     list += listing.baha.join('\n');

     list += "\n\n<h1 class='section'>The Báb</h1> \n";
     list += listing.bab.join('\n');

     list += "\n\n<h1 class='section'>‘Abdu’l-Bahá</h1> \n";
     list += listing.abd.join('\n');

     list += "\n\n<h1 class='section'>Shoghi Effendi</h1> \n";
     list += listing.shoghi.join('\n');

     list += "\n\n<h1 class='section'>Other</h1> \n";
     list += listing.other.join('\n');

     $("#book_list").html(list);

  })
  .error(function(err) { console.log("error", err); });
});

