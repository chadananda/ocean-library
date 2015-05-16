

// Temporary Panel to Provide Demonstration of Themes in Ocean formatted HTML

if (/plaintext=true/.test(window.location) || /audioreading=true/.test(window.location)) {
  $('html').hide();
}

var library_list = 'https://dl.dropboxusercontent.com/u/382588/JS/Projects/ocean_library/index.html';
var TTS_URLS = {};


$(function() {
  $('head').append('<link rel="stylesheet" type="text/css" href="assets/common/panel.min.css">');
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
  links+= ' <a id="accents">Validate Baha\'i Terms</a><br> \n';
  links+= '   --- <br> \n';
  links+= ' <a id="plaintext">Plain Text</a><br> \n';
  links+= ' <a id="audio_reading">Audio-Reader Format</a><br> \n';


  // check if this page was reloaded specifically to diplay accents report
  if (/check_accents=true/.test(window.location)) _load_accents_scripts();
  else if (/plaintext=true/.test(window.location)) _show_as_plaintext();
   else if (/audioreading=true/.test(window.location)) _show_as_audioreading();
    else if (/transtest=true/.test(window.location)) _filter_words();

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
      var base_en="https://dl.dropboxusercontent.com/u/382588/JS/Projects/ocean_library/Library/";
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
      var base_en="https://dl.dropboxusercontent.com/u/382588/JS/Projects/ocean_library/Library/";
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
      var base_en="https://dl.dropboxusercontent.com/u/382588/JS/Projects/ocean_library/Library/";
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
      var base_en="https://dl.dropboxusercontent.com/u/382588/JS/Projects/ocean_library/Library/";
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
  });

  $("#control_panel_hidden").mouseenter(function(){
    $(this).hide();
    $("#control_panel").show();
  });

  $("#control_panel").mouseleave(function(){
    $(this).hide();
    $("#control_panel_hidden").show();
  });

});


function _show_as_audioreading(){
  $("section.titlepage").not(":first").remove();
  $("section.titlepage img").remove();
  $("section.section_toc").remove();
  $(".section_header div, .section_header h3, .section_header h2, h3.subhead, h2.section").hide();
  $('p[id], div.par[id], .dropcap').removeClass('dropcap').addClass('nodropcap');
  $('body').addClass('audio_reading line-height_3 font_sanchez');

  var body = $('body').html();
  var sentence_split = /([a-záíúḥḍẓ’]{3}(?:["|’|”]{0,2})[.|!|?|:](?:["|’|”]{0,2}))((?: <a.*?<\/a> |\s+| <span.*?<\/span> )(?:["|‘|“]{0,2})[A-ZÁÍÚḤṬẒḌ])/g;
  var sentence2_split = /((?:[.|!|?])(?:<\/q>))(\s{1,2})/g;
  var sentence3_split = /((?:<\/q>)(?:[.|!|?]))(\s{1,2})/g;
  var sentence_marker = '$1<span class="sent_bk"></span>$2';


  var semicolon_split = /([;])( {1,2})/g;
  var semicolon_marker = '$1&nbsp;&nbsp;&nbsp; <span class="sentence_seperator">/</span>&nbsp;&nbsp;&nbsp; $2';
  var phrase_split = /([,”])( {1,2})/g;
  var phrase_marker = '$1&nbsp;&nbsp; $2';
  var quote_split = /(<\/q>)( {1,2})/g;
  var quote_marker = '$1&nbsp;&nbsp; $2';

  body = body.replace(semicolon_split, semicolon_marker)
             .replace(sentence_split,  sentence_marker)
               .replace(sentence2_split,  sentence_marker).replace(sentence3_split,  sentence_marker)
             .replace(phrase_split,    phrase_marker)
             .replace(quote_split,     quote_marker);

  $('body').html(body);
  _insert_reading_instructions();
  _insert_new_section_titles();
  // _insert_play_button();
  _insert_pronunciation_buttons();

  $('html').show();
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



function _insert_pronunciation_buttons() {
  // load in the blockparse script
  $.getScript('assets/common/parseblock.js', function() {
    $('section.titlepage, p[id], div.par, section_header').not('.audiobuttons')
      .hover( _insert_pronunciation_buttons_block, null);
  });

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
    $('span.wrd[data-phoneme]').addClass('tts');

    $('.tts').click(function(){
      var tts = '\\Prn="' + $(this).data('phoneme') +'"\\';
      var word = $(this).text();
console.log(word + ': '+tts);
      _tts_word($(this).data('phoneme') ? tts : word);
    });
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



function  _insert_play_button() {
  $('section.titlepage, p[id], div.par, section_header').each(function(){
    var id = $(this).attr('id');
    $( this ).append( $( "<div class='audioreader' data-id='"+id+"'><span class='fa fa-play-circle-o fa-2x'></span></div>" ) );
  });
  $('div.audioreader').click(function(){
    var id = $(this).data('id');
    //alert(id);
    _read_text( $('#'+id).text() );
  });
}

function _insert_reading_instructions(){
  var wpm = 180;
  var count = _word_count(), time;
  var minutes_total = Math.floor(count / wpm) + 1;
   if ((minutes_total % 60) > 55) minutes_total += (60-(minutes_total % 60));
  var hours = Math.floor(minutes_total / 60);
   if (hours>0) hours = hours.toString() + (hours > 1 ? ' hours' : ' hour')
  var minutes = minutes_total % 60; //Math.floor(minutes_total - (hours * 10800));
   if (minutes < 5) minutes = 0;
   if (minutes>0) minutes = minutes.toString() + (minutes>1 ? ' minutes' : ' minute');


  if (hours && minutes) time = hours +' and '+ minutes;
   else if (hours) time = hours;
    else if (minutes) time = minutes;

  var instructions = '\n\n<div class="reading_instructions">\n';
  instructions += '<h1> Audio Reading Instructions </h1>';
  instructions += '<p> With <b>'+ _numberWithCommas(count) + ' words</b>, this book’s final audio should be about <b>'+
     time + '.</b> <br>';

  instructions += ' Please consider the following reading conventions: </p> <ul>';
  instructions += '<li> Do not read paragraph numbers, these are only for location reference';
  instructions += '<li> Markers between phrases and breaks after sentences sentences are pause suggestions for your convenience.';
  instructions += '<li> If you make a mistake while reading, just clap your hands in front of the mic and then re-read the phrase. '+
  ' This will help the audio engineer to locate the mistakes and remove the mistaken portion';
  instructions += '<li> Some foreign words will be followed with a bracketed pronunciation suggestion. '+
  ' If you have trouble with a foreign word, just clap in front of the mic and then repeat the word several times '+
  ' until you are satisfied with the reading. The audio engineer will then remove all but the last reading.';

  instructions += '<li> Before attempting your first reading, take 30 minutes to complete this video '+
    ' training for pronunciation of Bahá’í transliterated terms: '+
    '  &nbsp; <a href="http://bit.ly/bahai-pronunciation">http://bit.ly/bahai-pronunciation</a> ';


  instructions += '\n</div>\n\n';
  $('body').prepend(instructions)
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
  result = words.join(' ');

  return result;
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
  var base_url = 'https://dl.dropboxusercontent.com/u/382588/JS/Projects/diacritical/';
  $.getScript(base_url + 'diacritical.js', function() {
     $.getScript(base_url + 'suggest.js', function() {
      setTimeout(function(){ $('#loadpage').remove() }, 6000);
     });
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
        ' <img src="assets/common/spinner.gif"> <b>Loading Bahá’í Terms Dictionary ... Please wait!</b> </p> </div>';
  $('body').append(box);
}





