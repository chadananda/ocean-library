

// Temporary Panel to Provide Demonstration of Themes in Ocean formatted HTML

if (/plaintext=true/.test(window.location) ||
    /audioreading=true/.test(window.location) ||
    /wordlist=true/.test(window.location)
   ) {
   // hide HTML without Jquery
   document.getElementsByTagName("html")[0].style.display = "none";
}

var library_list = 'books-work/proofing-list.html';
var TTS_URLS = {};

// globals for recording
var recorder = {};
var recorded_blocks = {};
//var audio_context;
//var audio_urls = {}; // a list of audio urls saved to the server keyed by selector id
var current_block;
var BOOK_ID ='';
var BOOK_LANGUAGE = 'en';
var block_map = {};
//var READER = '';


var ACCESS_PART_CRED = 'AKIAJQ6K5GDWLDAA4JTQ'; //
var ACCESS_SEC_PART = '/NQP60gBgaD22QS4WD4m';
var AWS_BUCKET = 'ocean-books-audio';
//var DEFAULT_AUDIO_FORMAT = 'audio/wav';




$(function() {

  $('head').append('<link rel="stylesheet" type="text/css" href="../assets/common/panel.min.css">');
  $('body').append("<div id='control_panel_hidden' class='screenonly'>i</div>");

  var color_themes = ['theme_white','theme_sepia','theme_night'];
  var fonts = ['font_gentium','font_sanchez','font_cabin','font_bembo','font_dyslexic'];
  var line_height = ['line-height_1', 'line-height_2', 'line-height_3'];
  var links = '';


  links+= ' <a href="'+library_list+'" target="_blank">Other Completed Books</a><br> \n';
  links+= '   --- <br> \n';
  for (i=0; i<color_themes.length; i++) links += ' <a id="'+color_themes[i]+'">'+color_themes[i]+'</a><br> \n ';
  links+= '   --- <br> \n';
  for (i=0; i<fonts.length; i++) links += ' <a id="'+fonts[i]+'">'+fonts[i]+'</a><br> \n ';
  links+= '   --- <br> \n';
  for (i=0; i<line_height.length; i++) links += ' <a id="'+line_height[i]+'">'+line_height[i]+'</a><br> \n ';
  links+= '   --- <br> \n';
  links+= ' <a id="study_format">Print Study Ver.</a><br> \n';
  links+= ' <a id="study_format_centered">Centered Study</a><br> \n';
  links+= '   --- <br> \n';
  links+= ' <a id="validate">Validate HTML</a><br> \n';
  links+= ' <a id="accents">Validate Bahá’í Terms</a><br> \n';
  links+= '   --- <br> \n';
  links+= ' <a id="wordlist">Show Wordlist</a><br> \n';
  links+= '   --- <br> \n';
  links+= ' <a id="plaintext">Plain Text</a><br> \n';
  links+= ' <a id="audio_reading">Teleprompter</a><br> \n';



  // check if this page was reloaded specifically to diplay accents report
  if (/check_accents=true/.test(window.location)) _load_accents_scripts();
  else if (/plaintext=true/.test(window.location)) _show_as_plaintext();
   else if (/audioreading=true/.test(window.location)) _show_as_audioreading();
    else if (/transtest=true/.test(window.location)) _filter_words();
     else if (/wordlist=true/.test(window.location)) _word_list();

  //links+= '   --- <br> \n';
  $('body').append("<div id='control_panel' class='screenonly'></div>");
  $('#control_panel').append(links);


  $("#control_panel a").click(function(){
    var id = $(this).attr('id');
    if (color_themes.indexOf(id)>-1) $('body').removeClass(color_themes.join(' ')).addClass(id);
    else if (fonts.indexOf(id)>-1) $('body').removeClass(fonts.join(' ')).addClass(id);
    else if (line_height.indexOf(id)>-1) $('body').removeClass(line_height.join(' ')).addClass(id);
    else if (id === 'study_format') {
      $('body').addClass('study_format');
      window.print();
      $('body').removeClass('study_format');
    }
    else if (id === 'study_format_centered') {
      $('body').addClass('study_format_centered');
      window.print();
      $('body').removeClass('study_format_centered');
    }
    else if (id === 'validate') {
      var base_en="";
      var base_tr= base_en+"translation/";
      var validator_url = "http://validator.w3.org/check?uri=";
      var loc = window.location.href;
      // for local files, add the dropbox path
      if (/file:\/\//g.test(loc)) {
       loc = loc.split('/').pop();
       loc = /,en\./.test(loc) ? base_en + loc : base_tr + loc;
      }
      window.open(validator_url + encodeURIComponent(loc));
    }
    else if (id === 'accents') {
      //var base_en="https://dl.dropboxusercontent.com/u/382588/JS/Projects/ocean_library/Library/";
      var base_en="books-work/";
      var base_tr= base_en+"translation/";
      var loc = window.location.href;
      if (!(/check_accents=true/.test(loc))) loc += '?check_accents=true';
      // for local files, add the dropbox path
      if (/file:\/\//g.test(loc)) {
       loc = loc.split('/').pop();
       loc = /,en\./.test(loc) ? base_en + loc : base_tr + loc;
       loc += '?check_accents=true';
      }
      window.open(loc);
    }
    else if (id === 'plaintext') {
      var base_en="";
      var base_tr= base_en+"translation/";
      var loc = window.location.href;
      // for local files, add the dropbox path
      if (/file:\/\//g.test(loc)) {
       loc = loc.split('/').pop();
       loc = /,en\./.test(loc) ? base_en + loc : base_tr + loc;
       loc += '?plaintext=true';
       window.open(loc);
      } else _show_as_plaintext();
    }
    else if (id === 'audio_reading') {
      var base_en="";
      var base_tr= base_en+"translation/";
      var loc = window.location.href;
      if (!(/audioreading=true/.test(loc))) loc += '?audioreading=true';
      // for local files, add the dropbox path
      if (/file:\/\//g.test(loc)) {
       loc = loc.split('/').pop();
       loc = /,en\./.test(loc) ? base_en + loc : base_tr + loc;
      }
      if (loc != window.location.href) window.open(loc);
       else _show_as_audioreading();
    }
    else if (id === 'wordlist') {
      var loc = window.location.href;
      if (!(/wordlist=true/.test(loc))) loc += '?wordlist=true';
      if (loc != window.location.href) window.open(loc);
       else _word_list();
    }
  });

  $("#control_panel_hidden").mouseenter(function(){
    $(this).hide();
    $("#control_panel").show();
  });

  $("#control_panel").mouseleave(function(){
    $(this).hide();
    $("#control_panel_hidden").show();
  });


  // if not audioreader mode, load fn.js, toc.js
  if ($('html').is(":visible")) {
    $.getScript('../assets/common/toc.js');
    $.getScript('../assets/common/fn.js');
  }
  $.getScript('../assets/common/scrollintoview.js');

});


/* ============================================
      AUDIO READING TELEPROMPTER MODE
=============================================== */

function _show_as_audioreading(){
  $('body').append("<div id='control_panel_hidden' class='screenonly'>i</div>");
  $("section.titlepage").not(":first").remove();
  $("section.titlepage img").remove();
  $("#section_toc").remove();
  $("aside").remove();
  $('.noaudio').remove();
  $('.copyright').remove();
  $('.illustration').remove();
  $('span[data-pg]').remove();
  $('p[id], div.par[id], .dropcap').removeClass('dropcap').addClass('nodropcap');
  $('body').addClass('audio_reading line-height_3');
  $('hr').remove();
  //$('p').each(function(){if ($(this).text().trim().length<1) $(this).hide();});

  var body = $('body').html();
  var sentence_split = /([a-záíúḥḍẓ’]{3}(?:["|’|”]{0,2})[.|!|?|:](?:["|’|”]{0,2}))((?: <a.*?<\/a> |\s+| <span.*?<\/span> )(?:["|‘|“]{0,2})[A-ZÁÍÚḤṬẒḌ])/gi;
  var sentence2_split = /((?:[.|!|?|”])(?:<\/q>))(\s{1,2})/g;
  var sentence3_split = /((?:<\/q>)(?:[.|!|?]))(\s{1,2})/g;
  var sentence_marker = '$1<span class="sent_bk"></span>$2';
  var semicolon_split = /([;])( {1,2})/g;
  var semicolon_marker = '$1&nbsp;&nbsp;&nbsp; <span class="sentence_seperator">/</span>&nbsp;&nbsp;&nbsp; $2';
  var phrase_split = /([,”])( {1,2})/g;
  var phrase_marker = '$1&nbsp; $2';
  var quote_split = /(<\/q>)( {1,2})/g;
  var quote_marker = '$1&nbsp; $2';

  // remove letter numbering from sub headers
  body = body.replace(/(<h[1-5].*?subhead.*?>)\s?[a-dA-D]\.\s?(.*?<\/h[1-5]>)/g, '$1$2');
  body = body.replace(semicolon_split, semicolon_marker)
             .replace(sentence_split,  sentence_marker)
             .replace(sentence2_split, sentence_marker).replace(sentence3_split,  sentence_marker)
             .replace(phrase_split,    phrase_marker)
             .replace(quote_split,     quote_marker);

  $('body').html(body);
  BOOK_ID = $('head meta[name=description]').attr('data-bookid');
  BOOK_LANGUAGE = BOOK_ID.split('-').pop().trim().toLowerCase() || BOOK_LANGUAGE;


  _get_user_credentials();
  _insert_reading_instructions();
  _insert_new_section_titles();
  _insert_recording_controls();
  //_insert_pronunciation_buttons();

  // $.getScript('assets/common/mark-words.js');

  // add CSS and functionality and then show html after CSS is loaded
  $('body').append('<link rel="stylesheet" id="audioreader_stylesheet" href="">');
  $("#audioreader_stylesheet").load(function(){
    // $.getScript('../assets/common/audioreader.js');
    $('html').show();
    // Amazon S3
    $.getScript('https://sdk.amazonaws.com/js/aws-sdk-2.5.3.min.js').done(function(){
      AWS.config.credentials = {};
      AWS.config.credentials.accessKeyId  = ACCESS_PART_CRED;
      AWS.config.credentials.secretAccessKey = ACCESS_SEC_PART + localStorage.getItem('pass');
      AWS.config.region = 'us-west-1';
      _fetch_S3_audio_filelist(); // loads appropriate audio files from S3 and attaches URLS to blocks
    });
    // wav version
    /*
    $.getScript('assets/common/Recorderjs/dist/recorder.js').done(function(){
       _init_wav_recorder();
    }).fail(function(err){console.log('error loading recorder', err);});
    */
    $.getScript('../assets/common/rec/recorder.min.js').done(function(){
      //_init_ogg_recorder();
    }).fail(function(err){console.log('error loading recorder', err);});

  }).attr("href", "../assets/common/audioreader.css");
}

function _insert_recording_controls_item(block, audioid) {
  var recordBlock = "<span class='audiocontrols'>"+
   " <i class='fa fa-play-circle-o playbutton'></i> " +
   " <i class='fa fa-stop-circle-o stopbutton'></i> " +
   " <i class='fa fa-microphone recordbutton'></i> </span>";
  var stopRecordBlock = "<span class='audiocontrols_stop '> "+
   " <i class='fa fa-ban cancelrecordingbutton'></i> "+
   " <i class='fa fa-stop-circle-o finishedrecordingbutton'></i> "+
   " <i class='fa fa-arrow-circle-o-down finishedrecordingcontinuebutton'></i> "+
   " </span> <span class='clearfix'></span> ";
  var verifySaveBlock = '<span class="audiocontrols_save">'+
   ' <i class="fa fa-floppy-o blink savebutton"></i>'+ "</span>";
  var selector = getDomPath(block).replace(/(.*?)\.(.*?)/g, '$1\\.$2');
  $(block).prepend(recordBlock).append(stopRecordBlock).prepend(verifySaveBlock);
  $(block).attr('data-audioid', audioid).attr('data-selector', selector);
  block_map[selector] = {
    'audioid': audioid,
    'selector': selector,
    'url': ''
  };
  _display_block_audio_state(selector);
}

function _html_textlength(block) {
  // returns text length given a block of html.  If array, items are first joined
  if (Array.isArray(block)) block = block.join('\n');
  return $('<div>').html(block).text().length;
}

function _split_block_by_delimiter(content, delimiter, maxlength) {
  // returns an array of items split by delimiter, attempting to keep them under maxlength per item
  if (!maxlength) maxlength = 600;
  var chunks = content.split(delimiter);
  var newChunks = [[]];
  for (var i=0; i<chunks.length; i++) {
    var last_len = _html_textlength(newChunks[newChunks.length-1]);
    var new_len = _html_textlength(chunks[i]);
    if ((last_len+new_len < maxlength) || (last_len===0)) newChunks[newChunks.length-1].push(chunks[i]);
    else newChunks.push([chunks[i]]);
  }
  for (var i=0; i<newChunks.length; i++) newChunks[i] = newChunks[i].join(delimiter);
  return newChunks;
}

function _split_block(selector) {
  var maxlength = 600;
  var content = $(selector).html();
  var blockID = $(selector).attr('id');
  var blockIDstr = $(selector).attr('id').replace(/(.*?)\.(.*?)/g, '$1\\.$2');
  result = [{ sel: getDomPath(selector),
              selStr: getDomPath(selector).replace(/(.*?)\.(.*?)/g, '$1\\.$2'),
              cont: content,
              prevBlock: '',
              hasChildren: false,
              subNum: 0}];
  if (!blockID) return false;

  if (_html_textlength(content) > maxlength) {


    //console.log('splitting paragraph');
    var sentence_delimiter = '<span class="sent_bk"></span>';
    var semicolon_delimiter = '&nbsp;&nbsp;&nbsp; <span class="sentence_seperator">/</span>&nbsp;&nbsp;&nbsp;';
    // split block by sentence delimiter
    var newChunks = [];
    var chunks = _split_block_by_delimiter(content, sentence_delimiter, maxlength);
    for (var i=0; i<chunks.length; i++) {
      if (_html_textlength(chunks[i]) <= maxlength) newChunks.push(chunks[i]);
      else {
        // split sentnce by semicolon delimiter
        var semichunks = _split_block_by_delimiter(chunks[i], semicolon_delimiter, maxlength);
        newChunks.push.apply(newChunks, semichunks);
      }
    }

    /*
    var chunks = content.split(sentence_delimiter);
    var newChunks = [''];
    for (var i=0; i<chunks.length; i++) {
      var len = _html_textlength(newChunks[newChunks.length-1]);
      var newlen = _html_textlength(chunks[i]);
      if ((len+newlen < 600) || (len===0)) newChunks[newChunks.length-1] += chunks[i] + sentence_delimiter;
      else newChunks.push(chunks[i]);
      // check if this block is still too long and splitable
      var blocklen = _html_textlength(newChunks[newChunks.length-1]);
      if (blocklen>600) {
        //console.log('#'+blockID +" Sentence block too long: ("+ blocktext.length +"),  "+ blocktext);
        var semichunks = newChunks[newChunks.length-1].split(semicolon_delimiter);
        var newsemichunks = [''];
        for (var j=0; j<semichunks.length; j++) {
          var len = _html_textlength(newsemichunks[newsemichunks.length-1]);
          var newlen = _html_textlength(semichunks[j]);
          if ((len+newlen < 600) || (len===0)) newsemichunks[newsemichunks.length-1] += semichunks[j] + semicolon_delimiter;
          else newsemichunks.push(semichunks[j]);
        }
        // if we did a split, add them all to the main list
        if (newsemichunks.length>1) {
          console.log('split sub-block into '+newsemichunks.length+' parts: '+newsemichunks);
          newChunks.pop();
          newChunks.push.apply(newChunks, newsemichunks);
        }
      }
    }*/



    //console.log('Split paragraph into '+ chunks.length+ ' sub-blocks');
    // assign data for each chunk
    if (newChunks.length>1) {
      result[0].sel = '#'+blockID;
      result[0].cont = newChunks[0];
      result[0].selStr = '#'+ blockIDstr;
      result[0].hasChildren = true;
      for (i=1; i<newChunks.length; i++) {
        result.push({
          cont: newChunks[i],
          sel: '#'+blockID +'_'+ i,
          selStr: '#'+ (blockIDstr+'_'+i),
          prevBlock: (i<2) ? '#'+blockIDstr : '#'+blockIDstr +'_'+ (i-1),
          subNum: i
        });
      }
    }
   //if (blockID=='f.3') console.log(result);
  }

  return result;
}

function auto_ids() {
  var auto_id = 1;
  $('section.titlepage, section.content').find('h1,h2,h3,h4,h5,div.par,p').not('.noaudio').not('[id]').each(function(){
     $(this).attr('id', 'auto_'+ auto_id++).addClass('noid');
  });
}
function _insert_recording_controls() {
  var audioid = 1;
  auto_ids();
  $('section.titlepage, section.content').find('h1,h2,h3,h4,h5,div.par,p').not('.noaudio').each(function(){
    if ($(this).text().trim().length<1) return; // ignore empty blocks
    var blocks = _split_block(this);
    for (key=0; key<blocks.length; key++) {
      var obj = blocks[key];
      if (obj.hasChildren) $(obj.selStr).html(obj.cont).addClass('subBlockParent');
      else if (obj.subNum>0){ // append block

        var blockType = $(this).prop("tagName").toLowerCase();
        var block = '<'+blockType+' id="'+obj.sel.replace(/\#/,'')+'"></'+blockType+'>';
        //if ($(this).attr('id')=='f.3') console.log(obj.sel, block, obj.prevBlock, obj);
        $(obj.prevBlock).after(block);
        $(obj.selStr).addClass('subBlock').attr('data-prev', obj.prevBlock).html(obj.cont);
      }
      if ($(obj.selStr).length) {
        //console.log(obj.selStr, audioid);
        _insert_recording_controls_item(obj.selStr, audioid);
      }
    }
    audioid++;
  });
  // record and play icons
  $('html').append("<div id='countdown'><span class='content'>3</span></div>");
  $('body').append("<div id='nowRecording'><i class='fa fa-microphone'></i></div>");
  $('html').append("<audio id='audio_player'><source src='' type='audio/mpeg'></audio>");
  // play/record container
  $('div.audioreader').click(function(){
    //var id = $(this).data('id');
    //
    // ?
    //
  });
  $('.playbutton').click(function(){
    var selector = $(this).parent().parent().attr('data-selector');
    _play_audio(selector);
  });
  $('.stopbutton').click(function(){
    var selector = $(this).parent().parent().attr('data-selector');
    _stop_audio(selector);
  });
  $('.recordbutton').click(function(){
    var selector = $(this).parent().parent().attr('data-selector');
    _record_audio(selector);
  });
  // finished recording buttons
  $('.finishedrecordingbutton').click(function(){
    setTimeout(_stop_recording, 200);
  });
  $('.finishedrecordingcontinuebutton').click(function(){
    current_block = $(this).parent().parent().attr('data-selector');
    setTimeout(function(){
      _stop_recording();
      $(current_block).removeClass('needsAudio');
      _scrollto_next_needsAudio(true); // force start of next paragraph
    }, 350);
  });
  $('.cancelrecordingbutton').click(function(){
    _stop_recording(true);
  });
  // save button
  /*
  $('.savebutton').click(function(){
    var selector = $(this).parent().parent().attr('data-selector');
    _save_audio(selector);
  }); */
  $('#soundcheck_btn').click(function(){
    //alert("Sorry, this feature is not yet implemented.");
  });
}

function _insert_reading_instructions(){
  var wpm = 113.45;
  var costpm = 5.8694;
  var count = _word_count(), time;
  var minutes_total = Math.floor(count / wpm) + 1;
   if ((minutes_total % 60) > 55) minutes_total += (60-(minutes_total % 60));
  var hours = Math.floor(minutes_total / 60);
   if (hours>0) hours = hours.toString() + (hours > 1 ? ' hours' : ' hour')
  var minutes = minutes_total % 60; //Math.floor(minutes_total - (hours * 10800));
   if (minutes < 5) minutes = 0;
   if (minutes>0) minutes = minutes.toString() + (minutes>1 ? ' minutes' : ' minute');
  var cost_total = (minutes_total * costpm).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");


  if (hours && minutes) time = hours +' and '+ minutes;
   else if (hours) time = hours;
    else if (minutes) time = minutes;

  var instructions = '\n\n<div class="reading_instructions">\n';
  instructions += '<h1> Audio Reading Instructions  </h1>';
  instructions += '<div class="wordcount"> With <b>'+ _numberWithCommas(count) + ' words</b>, this book’s final audio should be about <b>'+ time + '.</b> </div>';

  // instructions list
  var list = [];
  list.push('Find a quiet place to read with no low background noise such as washing machines or air vents. '+
    'Make sure to always read in exactly the same location so audio is consistent between sessions. ');
  list.push('If your microphone has a "gain" (input volume) adjustment, set it to about 75%. Do not speak directly into the microphone but very slightly off center.');
 // list.push('Each time you begin a new session, repeat the sound check process: '+
 //   ' &nbsp; <button type="button" id="soundcheck_btn">Sound Check <span class="fa fa-microphone fa-sm"></span></button>');
  list.push('Do not read paragraph numbers, these are only for your convenience. '+
    'Phrase markers and sentence breaks are likewise only for convenience.');
  //list.push();
  list.push('For Bahá’í transliterated terms:  &nbsp; <a href="http://bit.ly/bahai-pronunciation">http://bit.ly/bahai-pronunciation</a> ');
  list.push('After each paragraph is recorded, listen to check for mis-reads and re-record if necessary.');
  list.push('<button type="button" onclick="_scrollto_next_needsAudio(); return false" id="soundcheck_btn">'+
    '<span class="fa fa-microphone fa-sm"></span> &nbsp; Scroll down to next block needing recorded </button>');
  list.push('<button type="button" onclick="_clear_password(); return false" id="soundcheck_btn">'+
    '<span class="fa fa-trash fa-sm"></span> &nbsp; Reset Password </button>');
  instructions += '<ul>\n  <li>'+ list.join('</li><br>\n   <li>') +'</li>\n</ul><br>';

  instructions += ' &nbsp; &nbsp; <span style="font-size: 6pt; color: silver;">v1.12, '+cost_total+'</span> ';

  instructions += '\n</div>\n\n';
  $('body').prepend(instructions);
}

// audio recording functions
function _get_user_credentials() {
  var reader = localStorage.getItem("reader_name");
  if (!reader) {
    reader = window.prompt("Please provide your full name: ", "");
    if (reader) localStorage.setItem('reader_name', reader.trim().replace(/[ ]/g, '-'));
  }
  var password = localStorage.getItem("pass");
  if (!password) do {
    password = window.prompt("Password: ", "");
    localStorage.setItem("pass", password);
  } while (!password);
}

function _clear_password() {
  localStorage.setItem('reader_name', '');
  localStorage.setItem('pass', '');
  _get_user_credentials();
}

function _block_url(block){
  var selector = $(block).attr('data-selector');
  var path_url = _current_book_storage_path() + _gen_block_audio_path(selector) + '.wav';
  return 'https://'+AWS_BUCKET+'.s3.amazonaws.com/'+path_url;
}
function _gen_block_audio_path(block, end_block) {
  var selector = $(block).attr('data-selector');
  end_block = end_block ? '-'+ $(end_block).attr('data-selector') : '';
  var audioid = $(selector).attr('data-audioid');
  // subBlockNum = (subBlockNum > 1) ? subBlockNum = '-'+ subBlockNum.trim(): '';
  var MAX_TEXT_LEN = 40;
  var sampletext = $(selector).text().replace(/\&nbsp\;/g, ' ').replace(/[\n\—]/g, ' ').replace(/\s+/g,' ')
    .replace(/[^a-zA-Z áÁíÍúÚ-’\-0-9]/g, '').trim().slice(0, MAX_TEXT_LEN).trim();
  if (sampletext.length===MAX_TEXT_LEN) sampletext = sampletext.slice(0, sampletext.lastIndexOf(' '));
  sampletext = sampletext.trim().replace(/\s+/g, '-');
  var result = ('000'+audioid).slice(-4) +','+ selector+end_block+ ',' +sampletext;
  return result;
}
function _current_book_storage_path() {
  var path = [];
  path.push(BOOK_LANGUAGE.trim().toLowerCase());
  path.push(BOOK_ID.trim().toLowerCase());
  path.push(localStorage.getItem("reader_name").trim().toLowerCase());
  var result = path.join('/') + '/';
  return result;
}
function _current_book_playlist_path() {
  var path = BOOK_ID.trim().toLowerCase() +'-'+
    localStorage.getItem("reader_name").trim().toLowerCase() +'.m3u';
  return path;
}
function _fetch_S3_audio_filelist(callback, last_key) {
  AWS.config.credentials.secretAccessKey = ACCESS_SEC_PART + localStorage.getItem('pass');
  var storage_path = _current_book_storage_path();
//console.log(_current_book_storage_path());
  var bucket = new AWS.S3({params: {Bucket: AWS_BUCKET }});
  var params = request = {Prefix: storage_path, Delimiter: '/'};
  if (last_key) params.Marker = last_key;
  bucket.listObjects(params, function (err, data) {
    if (err) {
      console.log('Could not load audio objects from S3', err);
      var password = window.prompt("Password failed, please enter it again: ", "");
      if (password) {
        localStorage.setItem("pass", password);
        _fetch_S3_audio_filelist(callback, last_key);
      }
    } else {
  //console.log('Raw S3 data: ', data);
      var items = data.Contents.filter(function(item){
        var match = ((item.Key.indexOf(storage_path)===0) && (item.Key.length > storage_path.length));
        if (!match) console.log (item.Key+', '+storage_path+', '+item.Key.indexOf(storage_path));
        return match;
      });
  //console.log(items.length+' filtered S3 items: ', items);
      items.forEach(function(item){
        var selector = item.Key.replace(/.*?\,(.*?)\,.*?$/ig, '$1');
  //console.log(selector);
        //var block = $(selector); // extract selector from path name
        var url = 'https://'+AWS_BUCKET+'.s3.amazonaws.com/'+ encodeURIComponent(item.Key);
        //console.log('Fetched S# URL: '+ url);
        //var audioid =  $(block).attr('data-audioid'); // don't trust the number in the

        block_map[selector] = {url: url, s3: item};
        // audio_urls[selector] = {url: info.url};
        _display_block_audio_state(selector);

        last_key = item.Key;
      });
      if (data.IsTruncated) _fetch_S3_audio_filelist(callback, last_key);
    }
  });
}
// after altering block audio, reset display state
function _display_block_audio_state(selector) {
  if (!$(selector).length) return;
  selector = $(selector).attr('data-selector');
  if (!selector || !block_map[selector] || !$(selector).length) {
    console.log('Error:  audio selector problem: '+selector);
    return;
  }
  if (block_map[selector].url) { // has audio
    $(selector).removeClass('needsAudio').addClass('hasAudio');
    $(selector).find('.playbutton').show();
  } else {  // needs audio
    $(selector).removeClass('hasAudio').addClass('needsAudio');
    $(selector).find('.playbutton').hide();
  }
}

function _insert_new_section_titles() {
  var section_pattern = $('head meta[data-section-title]').data('section-title');
    // insert new section title
  if (section_pattern) $('body section.content').each(function() {
    var title = section_pattern;
    var replace_fail = false;

    if (/{title}/.test(title)){
      var newtitle = $(this).find('.title').html().replace(/&nbsp;/g, ' ').replace(/<br>/g, ' ').replace(/<span .*?><\/span>/, ' ');
      if (newtitle) title = title.replace(/{title}/g, newtitle);

    }
    if (/{sectionnum}/.test(title)) {
      var sectionnum = $(this).data('sectionnum');
      if (sectionnum) title = title.replace(/{sectionnum}/g, sectionnum);
        else replace_fail = true;
    }
    if (/{date}/.test(title)) {
      var date = $(this).find('.date').html()
      if (date) title  = title.replace(/{date}/g, date);
    }
    if (/{subtitle}/.test(title)) {
      var subtitle = $(this).find('.subtitle').html().replace(/&nbsp;/g, ' ').replace(/<br>/g, ' ');
      if (subtitle) title  = title.replace(/{subtitle}/g, subtitle);
        else replace_fail = true;
    }
    if (replace_fail) title = $(this).find('.title').html();

    $(this).find('div.section_header').html("<h3 class='title'>"+title+"</h3>");
  });
}


function _init_ogg_recorder(selector) {
  //console.log('Initialized ogg recorder for: '+ selector);
  recorder = new Recorder({
              encoderApplication: 2048,
              encoderPath: '../assets/common/rec/encoderWorker.min.js',
              encoderSampleRate: 48000,
              resampleQuality: 10,
              streamPages: false,
              leaveStreamOpen: false,
              maxBuffersPerPage: 80,
              bufferLength: 16384,
              numberOfChannels: 1 });
  recorder.addEventListener( "dataAvailable", function(e){
    console.log('EventListener( "dataAvailable")');
    var dataBlob = new Blob( [e.detail], { type: 'audio/ogg' } );
    if (!cancelRecording) {
      block_map[selector].data = dataBlob;
      block_map[selector].url = URL.createObjectURL(block_map[selector].data); // add to id map
      _save_audio_ogg(selector);
      _display_block_audio_state(selector);
    } else console.log('recording canceled');
  });

  recorder.addEventListener( "streamError", function(e){
    console.log('Error encountered: ' + e.error.name );
  });

  recorder.addEventListener( "streamReady", function(e){
    // console.log('Audio stream is ready.');
  });

  recorder.initStream();
}
/*
function _init_wav_recorder() {
  // webkit shim
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
  window.URL = window.URL || window.webkitURL;
  //
  audio_context = new AudioContext;
  //
  navigator.getUserMedia({audio: true}, function(stream){
    var input = audio_context.createMediaStreamSource(stream);
    //input.connect(audio_context.destination); // Uncomment if you want the audio to feedback directly
    recorder = new Recorder(input, {numChannels:1} );
  }, function(e) {
    console.log('No live audio input: ' + e);
  });
}
*/
function _save_audio_ogg(selector){
  selector = $(selector).attr('data-selector');
  // upload to S3
  var filename = _current_book_storage_path() + _gen_block_audio_path(selector) + '.opus';
  //_AWS_save(filename, 'audio/wav', block_map[selector].data);
  var bucket = new AWS.S3({params: {Bucket: AWS_BUCKET}});
  var params = {Key: filename,  ContentType: 'audio/wav', Body: block_map[selector].data};
  // attempt to upload
  console.log('Saving audio to path: '+ filename);
  bucket.upload(params, function (err, data) {
    if (err) console.log('S3 Save Error: ', err);
    else {
      // release resource
      //console.log('Releasing old URL and discarding data blob');
      //URL.revokeObjectURL(block_map[selector].url);
      //block_map[selector].data.close();
      //block_map[selector].data = '';
      // success, update block_map and mark item
      console.log('S3 Saved file successfully');
      // update audio list  block_map[selector]
      block_map[selector].url = 'https://'+AWS_BUCKET+'.s3.amazonaws.com/'+_current_book_storage_path()+
        encodeURIComponent(_gen_block_audio_path(selector))+'.opus';
      $(selector).find('.savebutton').hide();
      $(selector).removeClass('needsSaving').addClass('hasAudio');
      //var next_block_selector = $(selector).next('.needsSaving').eq(0).attr('data-selector');
      //if (!next_block_selector) next_block_selector = $('.needsSaving').eq(0).attr('data-selector');
      //_scrollto_block(next_block_selector);
      //
      _save_playlist();
    }
  });
}
function _save_playlist() {
  var list = [];
  var complete = true;
  var keys = Object.keys(block_map);
  keys.forEach(function(key){
    if (block_map[key].url.length<5) complete = false;
    else list.push(block_map[key].url);
  });
  var filepath = _current_book_playlist_path();
  var bucket = new AWS.S3({params: {Bucket: AWS_BUCKET}});
  var params = {Key: filepath,  ContentType: 'audio/x-mpegurl', Body: list.join('\n')};
  // attempt to upload
  //console.log('Saving playlist: '+ filepath);
  bucket.upload(params, function (err, data) {
    if (err) console.log('S3 Save Error: ', err);
    else console.log('  Playlist saved successfully:  https://'+AWS_BUCKET+'.s3.amazonaws.com/'+filepath);
  });

}


/*
function _save_audio(block){
  var selector = $(block).attr('data-selector');
  // upload to S3
  var filename = _current_book_storage_path() + _gen_block_audio_path(selector) + '.wav';
  //_AWS_save(filename, 'audio/wav', block_map[selector].data);
  var bucket = new AWS.S3({params: {Bucket: AWS_BUCKET}});
  var params = {Key: filename,  ContentType: 'audio/wav', Body: block_map[selector].data};
  // attempt to upload
  console.log('Saving audio to path: '+ filename);
  bucket.upload(params, function (err, data) {
    if (err) console.log('S3 Save Error: ', err);
    else {
      // success, update block_map and mark item
      console.log('S3 Saved file successfully');
      // update audio list  block_map[selector]
      block_map[selector].url = 'https://'+AWS_BUCKET+'.s3.amazonaws.com/'+_current_book_storage_path()+
        encodeURIComponent(_gen_block_audio_path(selector))+'.wav';
      $(selector).find('.savebutton').hide();
      $(selector).removeClass('needsSaving').addClass('hasAudio');
      //var next_block_selector = $(selector).next('.needsSaving').eq(0).attr('data-selector');
      //if (!next_block_selector) next_block_selector = $('.needsSaving').eq(0).attr('data-selector');
      //_scrollto_block(next_block_selector);
    }
  });
}
*/

function _record_audio(selector) {
  selector = $(selector).attr('data-selector');
  console.log("_record_audio: ", selector);
  current_block = selector;
  _scrollto_block(selector);
  cancelRecording = false;
  $(selector).find('recordbutton').hide();
  $(selector).find('.playbutton').hide();
  $(selector).find('.stopbutton').hide();
  $(selector).find('.audiocontrols_stop').show();

  // initialize or re-initialize recorder object
  _init_ogg_recorder(selector);

  // show countdown
  $('#countdown .content').text('3').parent().show();
  setTimeout(function(){$('#countdown .content').text('2');}, 750);
  setTimeout(function(){$('#countdown .content').text('1');}, 1500);
  setTimeout(function(){
    $('#countdown').hide();
    $('#nowRecording').show();
    $(selector).addClass('isRecording');
    $('body').addClass('isRecording');
    recorder.start();
    //recorder.record();
  }, 2250);
}
function _stop_recording(forceCancel) {

  var selector = $(current_block).attr('data-selector');
  if (!(forceCancel===true)) forceCancel = false;
  cancelRecording = forceCancel;
  //console.log('_stop_recording', 'cancelRecording: '+cancelRecording);
  //console.log('  body.isRecording: '+ ($('body').hasClass('isRecording') ? 'true' : 'false' ));
  //console.log('  .isRecording: '+ ($(selector).hasClass('isRecording') ? 'true' : 'false' ));
  if (!$('body').hasClass('isRecording')) return;
  if ((!current_block) || (!$(current_block).hasClass('isRecording'))) return;
  // I'll bet a lot of this reset business would better go in _display_block_audio_state

    $(selector).find('.recordbutton').show();
    $(selector).find('.stopbutton').hide();
    $(selector).find('.audiocontrols_stop').hide();
    $(selector).removeClass('isRecording');
    $('body').removeClass('isRecording');
    $('#nowRecording').hide();
    //console.log("That's it, I'm stopping this recording!!");
    //
    // I'm delaying the stop recording for 1 second to try to prevent cutting the last word

    recorder.stop();
    _display_block_audio_state(selector);

    // for recorderjs we need to save the data
    if (!forceCancel) {
      //console.log("Recorded audio for current_block: ", selector);
      $(selector).find('.playbutton').show();
      $(selector).find('.audiocontrols_save').show();
      $(selector).addClass('needsSaving').addClass('hasAudio');
      /*
      recorder.exportWAV(function(blob) {
        block_map[selector].data = blob;
        block_map[selector].url = URL.createObjectURL(block_map[selector].data); // add to id map
        recorder.clear();
        //_save_audio(selector);
        _display_block_audio_state(selector);
      });
      */
    }
    if (forceCancel) _scrollto_block(selector);
}

function _play_audio(block) {

  //console.log('Playing audio for block: '+block, block_map[$(block).attr('data-selector')].url);

  var selector = $(block).attr('data-selector');
  _stop_recording(current_block);
  current_block = selector;
  var url = block_map[selector].url;
  //console.log('Playing audio for "'+selector+'"', url);
  // display state
  $(selector).find('.stopbutton').show();
  $(selector).find('.playbutton').hide();
  $(selector).find('.recordbutton').hide();

  //var el = $('#audio_player')[0];
  $('#audio_player').trigger('pause').prop("currentTime", 0);
  $('#audio_player source').attr('src', url);
  $('#audio_player').trigger('load').trigger('play');
  $('#audio_player')[0].addEventListener('ended', function(){
    _stop_audio(selector);
  });
}
function _stop_audio(block) {
  var selector = $(block).attr('data-selector');
  var current_block_selector = $(current_block).attr('data-selector');
  if (current_block_selector) {
    $(current_block_selector).find('.playbutton').show();
    $(current_block_selector).find('.recordbutton').show();
    $(current_block_selector).find('.stopbutton').hide();
  }
  if (selector && (selector !== current_block_selector)) {
    $(selector).find('.playbutton').show();
    $(selector).find('.recordbutton').show();
    $(selector).find('.stopbutton').hide();
  }
  $('#audio_player').trigger('pause');
}
function _scrollto_next_needsAudio(force_start_recording) {
  //var current_selector = $(current_block).attr('data-selector');
  //while (!current_selector.length) current_selector
  //
  var next_block_selector = $('.hasAudio').last().next('.needsAudio');
  _scrollto_block(next_block_selector);
  if (force_start_recording) _record_audio(next_block_selector);
  /*return;

  //if (!current_selector.length) console.dir(current_block);

  var next_block_selector = $(current_selector).next('.needsAudio').eq(0).attr('data-selector');
   // console.log ('next_block_selector', next_block_selector);
  if (!next_block_selector) next_block_selector = $('.needsAudio').eq(0).attr('data-selector');
  if (next_block_selector) {
    _scrollto_block(next_block_selector);
    if (force_start_recording) _record_audio(next_block_selector);
  }*/
}
function _scrollto_block(selector){
  if (!$(selector).length) return;
  var offset = $(selector).offset();
  $('html, body').animate({
      scrollTop: offset.top - 200,
      scrollLeft: 0
  });
  //console.log("Tried to scroll to: ", offset);
}
function getDomPath(el) {
  var result = '';
  if (!el) {
    console.log('error, no DOM element passed to getDomPath');
    return result;
  }

  if ($(el).attr('id')) result = '#'+$(el).attr('id');

  if (el.hasOwnProperty('jquery')) el = el[0];
  // if no id, generate absolute reference
  if (!result) {
    //console.log('getDomPath calculating path for: ', el);
    var stack = [];
    var result = '';
    while ( el.parentNode !== null ) {
      //console.log(el.nodeName);
      var sibCount = 0;
      var sibIndex = 0;
      for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
        var sib = el.parentNode.childNodes[i];
        if ( sib.nodeName == el.nodeName ) {
          if ( sib === el ) {
            sibIndex = sibCount;
          }
          sibCount++;
        }
      }
      if ( el.hasAttribute('id') && el.id != '' ) {
        stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
      } else if ( sibCount > 1 ) {
        stack.unshift(el.nodeName.toLowerCase() + ':eq(' + sibIndex + ')');
      } else {
        stack.unshift(el.nodeName.toLowerCase());
      }
      el = el.parentNode;
    }
    // removes the html and body elements
    result = stack.slice(2).join('>');
    // remove anything preceding the last id if one found
    if ((pos = result.lastIndexOf('#'))>-1) {
      //console.log(pos+', Cutting string "'+result+'" into "'+result.slice(pos)+'"')
      result = result.slice(pos);
    }
    //console.log('getDomPath calculated path: '+ result);
  }

  if (!result) {
    console.log('error, empty value returned from getDomPath');
    return;
  }

  return result;
}
function downsampleBuffer(buffer, rate) {
  // based on:
  // http://stackoverflow.com/questions/16296645/decrease-bitrate-on-wav-file-created-with-recorderjs/26245260#26245260
  if (!rate) rate = 16000;
  if (rate == sampleRate) return buffer;
  if (rate > sampleRate) {
    throw "downsampling rate show be smaller than original sample rate";
  }
  var sampleRateRatio = sampleRate / rate;
  var newLength = Math.round(buffer.length / sampleRateRatio);
  var result = new Float32Array(newLength);
  var offsetResult = 0;
  var offsetBuffer = 0;
  while (offsetResult < result.length) {
    var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    var accum = 0, count = 0;
    for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

/* ============================================
=============================================== */





function _insert_pronunciation_buttons() {
  // load in the blockparse script
  //
  //console.log('_insert_pronunciation_buttons');
  $.getScript('../assets/common/parseblock.js', function() {
    // console.log('got parseblock.js');
    $('section.titlepage, p[id], div.par, section_header').not('.audiobuttons')
      .hover( _insert_pronunciation_buttons_block, null);
  });/*  .fail(function(){
    if(arguments[0].readyState===0){
        //script failed to load
    }else{
        //script loaded but failed to parse
        console.log(arguments[2].toString());
    }
  }); */

  function _insert_pronunciation_buttons_block() {
    if ($(this).hasClass('audiobuttons')) return;
    $(this).addClass('audiobuttons');
    var id = $(this).attr('id');
    var lang = 'en', dir='ltr', parent = this;
    if ($(this).hasClass('translation')) {
      parent = $(this).find('div.altlang');
      lang = $(parent).attr('lang');
      dir = $(parent).attr('dir');
    }
    var html = $(parent).html();
    if (html.trim().length > 3) {
      var parser = new Parseblock();
      var wordlist = {};
      var newHTML = parser.wrapSpanWords(html);
      if (newHTML != html) {
        $(parent).html(newHTML);
      }
    }

   //$('[data-phoneme]').attr('data-tooltip', 'test tooltip');
   $('[data-phoneme]').each(function() {
     $(this).attr('data-tooltip', $(this).attr('data-phoneme'));
   });

  /*
     $('span.wrd[data-phoneme]').addClass('tts');



      $('.tts').click(function(){
        var tts = '\\Prn="' + $(this).data('phoneme') +'"\\';
        var word = $(this).text();
     console.log(word + ': '+tts);
        _tts_word($(this).data('phoneme') ? tts : word);
      }); */


  }
}



function _tts_word(word) {
  //console.log('Sending word for audio: '+word);
  //return;

  if (TTS_URLS[word] != undefined) {
    //console.log('Playing cached url: '+ TTS_URLS[word]);
    _play_audio_url(TTS_URLS[word]);
  }
  else {
    //console.log('Requesting new audio url.');
    // Request
    jQuery.getJSON(
        "//vaas.acapela-group.com/Services/UrlMaker?jsoncallback=?",
       {
          prot_vers: 2, cl_login: "EVAL_VAAS", cl_app: "EVAL_9901129", cl_pwd: "1mj6qrjj",
          req_voice:"graham22k",
          req_text: word,
          //to produce ogg vorbis files, for MP3 you can remove this param.
          req_snd_type:"OGG"
       },
       function(data) {
         if (data.res === 'NOK') console.log('ERROR:  '+data.err_code+' - '+decodeURIComponent(data.err_msg));
         else {
           var url = data.snd_url.replace(/http:/, '');
           TTS_URLS[word] = url;
           _play_audio_url(url);
         }
       }
    );
  }
  // insert or override audio player at end of document
  function _play_audio_url(sound_url) {
    if (! $( "#wordttslayer" ).length ) $('body').append("<audio id='wordttslayer' src='"+sound_url+"' autoplay='autoplay'  />");
    else {
      $('#wordttslayer').trigger('pause').prop("currentTime",0);
      $('#wordttslayer').attr('src', sound_url).trigger('play');
    }
  }
}
























function _read_text(text){
  text = _filter_words(text);


  console.log('Sending text for audio: '+text);

  return;


  // Request
  jQuery.getJSON(
      "https://vaas.acapela-group.com/Services/UrlMaker?jsoncallback=?",
     {
        prot_vers: 2, cl_login: "EVAL_VAAS", cl_app: "EVAL_9901129", cl_pwd: "1mj6qrjj",
        req_voice:"graham22k",
        req_text: text,
        //to produce ogg vorbis files, for MP3 you can remove this param.
        req_snd_type:"OGG"
     },
     function(data)
     {
      if (data.res === 'NOK') console.log('ERROR:  '+data.err_code+' - '+decodeURIComponent(data.err_msg));
      else {
        if (! $( "#parvoiceplayer" ).length ) $('body').append("<audio id='parvoiceplayer' src='"+data.snd_url+"' autoplay='autoplay' controls='controls' />");
         else {
           $('#parvoiceplayer').trigger('pause').prop("currentTime",0);
           $('#parvoiceplayer').attr('src', data.snd_url).trigger('play');
         }
       }
     }
  );
}



function _filter_words(text) {
  var words = text.split(' ');
  for (var i=0; i<words.length; i++) {
    if (_is_term(words[i])) {
      words[i] = _accent_to_phoneme(words[i]) + ' ('+ _accent_to_pronounciation(words[i]) +') ';
    }
  }
  var result = words.join(' ');

  return result;
}



function _word_list() {
  var list = [];

  $('w').each(function(){
    list.push($(this).attr('id') + '|' + $(this).text());
  });

  var body = '<pre style="font-size: 10px">' + list.join("\n") +'</pre>';
  $('body').html(body);
  $('html').show();
}


function _strip_accents(term) {
    var in_chrs =  'àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ',
        out_chrs = 'aaaaaceeeeiiiinooooouuuuyyAAAAACEEEEIIIINOOOOOUUUUY',
        transl = {};
    eval('var chars_rgx = /['+in_chrs+']/g');
    for(var i = 0; i < in_chrs.length; i++){ transl[in_chrs.charAt(i)] = out_chrs.charAt(i); }
    return term.replace(chars_rgx, function(match){ return transl[match]; });
}

function _accent_to_phoneme(term) {
  var original = term;
  var prefix = term.replace(/^([^a-zḥṭẓḍ_áíú]*).*/i, '$1');
  var suffix = term.replace(/.*?([^a-zḥṭẓḍ_áíú]*)$/i, '$1');
  var term = term.replace(/^[^a-zḥṭẓḍ_áíú]/ig, '').replace(/[^a-zḥṭẓḍ_áíú]$/ig, '');
  console.log('prefix: '+ prefix);
  console.log('suffix: '+ suffix);
  console.log('term: '+ term);

   // Bahá’u’lláh ->  ba hah ow lah
  term = term.toLowerCase().trim();
  // conver html to glyph
  term = term.replace(/<u>/g, '_').replace(/<\/u>/g,'');
  // remove any remaining tags and whitespace
  term = term.replace(/<(.|\n)*?>/g, '').replace(/\s+/g, ' ').trim();
  // replace any letters that sound like another
  term = term.replace(/ḍ/g, 'z').replace(/_dh/g, 'z').replace(/_th/g, 's').replace(/u/g, 'o').replace(/aw/g, 'o');
  term = term.replace(/_gh/g, 'g');

  // connectors
  term = term.replace(/-i-/g, 'i-')
   .replace(/’(d-D|_kh-_kh|_sh-_sh|_ch-_ch|_zh-_zh|b-b|p-p|j-j|t-t|d-d|r-r|z-z|s-s|f-f|q-q|k-k|l-l|m-m|n-n|h-h)/, '$1') ;
  // remove beginning or ending ayn and hamza
  term = term.replace(/^[’‘]/, '').replace(/[’‘]$/, '');


  var vowels = {
    'ay' : 'eI',
    'iy' : 'eI',
    'ih' : 'eI',
    'a'  : '@',
    'á'  : 'A:',
    'i'  : 'e',
    'í'  : 'i:',
    'o'  : '@U',
    'ú'  : 'u:'
  };
  var consonants = {
    '_kh' : 'x',
    '_zh' : 'Z',
    '_sh' : 'S',
    '_ch' : 'tS',
    'b'   : 'b',
    'p'   : 'p',
    'j'   : 'dZ',
    't'   : 't',
    'ṭ'   : 't',
    'd'   : 'd',
    'r'   : 'r',
    'z'   : 'z',
    'ẓ'   : 'z',
    's'   : 's',
    'ṣ'   : 's',
    'f'   : 'f',
    'q'   : 'g',
    'k'   : 'k',
    'l'   : 'l',
    'm'   : 'm',
    'n'   : 'n',
    'h'   : 'h',
    'ḥ'   : 'h',
    'w'   : 'w',
    'v'   : 'v',
    'y'   : 'j',
    '’'   : '?',
    '‘'   : '?',
    '-'   : '?',
  };
  for(var key in vowels) if (key.length>1) {
    var regex = new RegExp(key, 'gi');
    term = term.replace(regex, vowels[key]+' ');
  }
  for(var key in consonants) if (key.length>1) {
    var regex = new RegExp(key, 'gi');
    term = term.replace(regex, consonants[key]+' ');
  }

  for(var key in vowels) if (key.length<2) {
    var regex = new RegExp(key, 'gi');
    term = term.replace(regex, vowels[key]+' ');
  }
  for(var key in consonants) if (key.length<2) {
    var regex = new RegExp(key, 'gi');
    term = term.replace(regex, consonants[key]+' ');
  }

  result = prefix +' / '+ term+ ' / '+ suffix;

  console.log ('Converted term to phonetic: '+original+' > '+result);
  return result;
}

function _accent_to_pronounciation(term) {
  var original = term;
  var prefix = term.replace(/^([^a-zḥṭẓḍ_áíú]*).*/i, '$1');
  var suffix = term.replace(/.*?([^a-zḥṭẓḍ_áíú]*)$/i, '$1');
  var term = term.replace(/^[^a-zḥṭẓḍ_áíú]/ig, '').replace(/[^a-zḥṭẓḍ_áíú]$/ig, '');
  console.log('prefix: '+ prefix);
  console.log('suffix: '+ suffix);
  console.log('term: '+ term);

   // Bahá’u’lláh ->  ba hah ow lah
  term = term.toLowerCase().trim();
  // conver html to glyph
  term = term.replace(/<u>/g, '_').replace(/<\/u>/g,'');
  // remove any remaining tags and whitespace
  term = term.replace(/<(.|\n)*?>/g, '').replace(/\s+/g, ' ').trim();
  // replace any letters that sound like another
  term = term.replace(/ḍ/g, 'z').replace(/_dh/g, 'z').replace(/_th/g, 's').replace(/u/g, 'o').replace(/aw/g, 'o');
  term = term.replace(/_gh/g, 'g');
  // replace remaining dot-unders
  term = term.replace(/ḥ/g, 'h').replace(/ṭ/g, 't').replace(/ẓ/g, 'z').replace(/ṣ/g, 's');
  // connectors
  term = term.replace(/-i-/g, 'i-')
   .replace(/’(d-D|_kh-_kh|_sh-_sh|_ch-_ch|_zh-_zh|b-b|p-p|j-j|t-t|d-d|r-r|z-z|s-s|f-f|q-q|k-k|l-l|m-m|n-n|h-h)/, '$1') ;
  // remove beginning or ending ayn and hamza
  term = term.replace(/^[’‘]/, '').replace(/[’‘]$/, '');


  var vowels = {
    'ay' : 'ai',
    'iy' : 'ai',
    'ih' : 'ai',
    'a'  : 'a',
    'á'  : 'aw',
    'i'  : 'eh',
    'í'  : 'ee',
    'o'  : 'oh',
    'ú'  : 'oo:'
  };
  var consonants = {
    '_kh' : 'k',
    '_zh' : 'zh',
    '_sh' : 'sh',
    '_ch' : 'ch',
    '’'   : ' ',
    '‘'   : ' ',
    '-'   : ' ',
  };
  for(var key in vowels) if (key.length>1) {
    var regex = new RegExp(key, 'gi');
    term = term.replace(regex, vowels[key]);
  }
  for(var key in consonants) if (key.length>1) {
    var regex = new RegExp(key, 'gi');
    term = term.replace(regex, consonants[key]);
  }

  for(var key in vowels) if (key.length<2) {
    var regex = new RegExp(key, 'gi');
    term = term.replace(regex, vowels[key]);
  }
  for(var key in consonants) if (key.length<2) {
    var regex = new RegExp(key, 'gi');
    term = term.replace(regex, consonants[key]);
  }

  result = prefix +' / '+ term+ ' / '+ suffix;

  console.log ('Converted term to phonetic: '+original+' > '+result);
  return result;
}

function _is_term(term) {
  term = term.toLowerCase().trim();
  // trim leading and trailing punctuation
  var newterm = term.replace(/^[^a-zḥṭẓḍ_áíú]/g, '').replace(/[^a-zḥṭẓḍ_áíú]$/g, '');
  console.log ("Checking to see if '"+newterm+"' is equal to '"+newterm.replace(/[ẓḥṭẓḍ_áíú’‘]/g, '')+"'")
  var isTerm = (newterm != newterm.replace(/[ẓḥṭẓḍ_áíú’‘]/g, ''));
  return isTerm;
}




function _show_as_plaintext(){
  $("section.titlepage").not(":first").remove();
  $("section.section_toc").remove();
  // convert body to string for some REGEX
  var body = $('body').html();
     // body = body.replace(/\s+— [0-9]+ —\n(.*?)\n/g, '\n\n$1\n\n');
  $('body').html(body);
  //
  $('body').addClass('plaintext');

  $('p[id], div.par[id]').removeClass('dropcap').addClass('nodropcap');
  $('.sectionnum').hide();

  $('h3.title').append('<br><br>');
  $('html').show();
}

function _load_accents_scripts(){
  // first, show modal wait box
  _show_loading_screen();
  // next, show all footnotes
  $('aside.fn').show();
  //alert('got here');
  var base_url = '';
  $.getScript(base_url + 'diacritical.js', function() {
    console.log('diacritical.js loaded');
     $.getScript(base_url + 'suggest.js', function() {
       console.log('suggest.js loaded');
       setTimeout(function(){
         $('#loadpage').remove();
         $("#control_panel").hide();
         $("#control_panel_hidden").show();
       }, 3000);
     });
  }).fail(function(err){
    console.log('diacritical.js failed to load', err);
  });
}

function _word_count() {
  var total = 0;
  $("body section.content").find('p, div.par').each(function() {
    total = total + $(this).text().toLowerCase()
             .replace(/[-‘’]/g,'').replace(/[^a-záíúḥḍẓ]/g, ' ').replace(/\s+/g, ' ')
             .split(' ').filter(function(value){ return value.length>2; })
             .length;
  });
  return total;
}

function _numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function _show_loading_screen() {
  var box = '<div id="loadpage" style="position:absolute; left:0px; top:0px; background-color:white; '+
    'layer-background-color:white; height:100%; width:100%;"> <p align="center" style="font-size: large;"> '+
        ' <img src="../assets/common/spinner.gif"> <b>Loading Bahá’í Terms Dictionary ... Please wait!</b> </p> </div>';
  $('body').append(box);
}







