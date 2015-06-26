#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app_ver = '0.0.2';
var program = require('commander');
//var fs = require('fs');
var colors = require('colors');
var inquirer = require("inquirer");
var cheerio = require('cheerio');
var mark = require('markup-js');
var fs = require('fs-sync'); fs.defaultEncoding = 'utf-8';
    var fs_node = require('fs');
var lang = require('languages');
var ocnparse = require('./ocnparse');
var httpsync = require('httpsync');
var _ = require('lodash');


var accents_url = 'http://diacritics.iriscouch.com/accents/_design/terms_list/_view/terms_list';

/*

TODO:

 * load and save dictionary of terms
 * during word parsing, mark each term with: .trm, data-arpabet='', data.ipa='', data.orig='', data.note=''
 * during word parsing, mark each pos with: .n .v .av .etc, data-pos=''

Notes:
 * remove "Word" from dictionary. How did it get there?

 */

function stripTags (str) {
 return str.replace(/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g, '').trim();
}

function ocnAccentsDictionary() {
// load config data

  //var config = load_library_config();
  var res, cachefile = './accents_dictionary.json', cache_fresh = false;

  // if cache file exists, check to see if it's fresh (about one hour or less)
  if (fs.exists(cachefile)) {
    var modified = fs_node.statSync(cachefile).mtime;
    var hours_since_modified = Math.round((Date.now() - Date.parse(modified)) / (1000 * 60 * 60));
    cache_fresh = (hours_since_modified < 1);
  }
  if (cache_fresh) {
    res = fs.readJSON(cachefile);
    console.log('Using recently cached dictionary.');
  } else {
    console.log('Downloading new copy of dictionary.');
    res = JSON.parse(httpsync.get(accents_url).end().data);
    fs.write(cachefile, JSON.stringify(res)); // save to cached file
  }
  console.log('Current dictionary contains '+ (res.rows).red + ' entries.');
  return res;



  res = res.rows;
  var dic = {};
  var i=1;
  var newTerm, instance, variantlist, variants, variant, stripped, key, max, index, verified, ambiguous;
  res.map(function(item) {
    var obj = {
      ref: item.value.ref[0]?item.value.ref[0]:'',
      verified: item.value.verified,
      original: item.value.original,
      notes: stripTags(item.value.definition),
      term: item.key
    };
    if (item.value['ambiguous']) {
      item.value.verified = false;
      item.value.ambiguous = true;
    } else item.value.ambiguous = false;
    if (dic[item.key]) {
      var found = false;
      dic[item.key].forEach(function(item){
        if (_.isEqual(item, obj)) found = true;
      });
      if (!found) dic[item.key].push(obj);
    } else dic[item.key] = [obj];
  });
  // remove absolute duplicates
  for(key in dic) if (dic.hasOwnProperty(key)) {
    newTerm = {term: key, count: 0, ref: [], notes: '', original: '', verified: false, ambiguous: false};
    for (i=0; i < dic[key].length; i++){
      instance = dic[key][i];
      if (instance.verified) newTerm.verified = true;
      if (instance.ambiguous) newTerm.ambiguous = true;
      if (instance.ref) newTerm.ref.push(instance.ref);
      if (instance.notes) newTerm.notes = instance.notes;
      if (instance.original) newTerm.original = instance.original;
      newTerm.count++;
    }
    if (newTerm.ambiguous) newTerm.verified = false; // ambiguous overrides verified
    newTerm.ref = newTerm.ref.join(', '); // back into a string
    dic[key] = newTerm; // replace old array with new compressed item
  }
  // remove unverified where a verified version exists
  // first gather together all variants
  variantlist = {};
  for(key in dic) if (dic.hasOwnProperty(key)) {
    stripped = ocnparse.term_strip_alpha(key);
    if (variantlist[stripped]) variantlist[stripped].push(dic[key]);
     else variantlist[stripped] = [dic[key]];
  }

  // next, loop through them all, keeping only the verified or highest number
  // loop through each if number is > highest or
  for(key in variantlist) if (variantlist.hasOwnProperty(key)) {
    variants = variantlist[key];
    if (variants.length === 1) variantlist[key] = variants[0];
    else {
      verified = false; ambiguous = false; index =0; max=0;
      for (i=0; i < variants.length; i++){
        item = variants[i];
        if (item.ambiguous) ambiguous = true;
        if (item.verified) {
          verified = true; index = i;
        } else if (!verified && item.count>max) {
          max = item.count; index = i;
        }
      }
      // now index should be set to the highest count item or the verified item
      if (!ambiguous) variantlist[key] = variants[index];
       else for (i=0; i < variantlist[key].length; i++){
         variantlist[key][i]['ambiguous'] = true;
         variantlist[key][i]['verified'] = false;
       }
    }
  }
  // now reformat dictionary to be the expected input format

  // now save dictionary to cached file location

  //console.log(variantlist);
}

function ocnImport(filename, opTargetDir) {
  if (!opTargetDir) opTargetDir = 'Library/books-work/1. raw-notproofed/';
  log("Importing book".green +' '+filename.red+ ' to '.green + opTargetDir.red);

}
function ocnBuildBook(bookid) {
  console.log('ocnBuildBook: '+bookid.red);

  // load config data
  var config = load_library_config();

  if (bookid === 'all') {
    fs.expand(config.paths.base+config.paths.books_work4 + "/*.html").forEach(function(item, index) {
      bookid = item.split('/').pop().split('.html').shift();
      ocnBuildBook(bookid);
    });
    return '';
  }

  if (bookid.split('-').length===2) bookid+='-en';
  log("Building completed book".green +' '+bookid.red);


  var book =  (config.books[bookid]? config.books[bookid] : {});
  //if (!book) {console.log("Warning! ".red+ "book "+bookid+" not found in library list! Aborting. "); return;}
  book.filename = bookid+'.html';
  var book_src = config.paths.base+config.paths.books_work4+book.filename;


  // verify that source file exists
  if (!fs.exists(book_src)) {console.log('Error, expecting book file at: '.red + book_src.green); return;}

  // parse source file into data object
  var bookobj = parse_final_book_html(fs.read(book_src), config);
  bookid = bookobj.meta.bookid;
  // do this later because we might have modified the bookid
  var book_dest   = config.paths.base+config.paths.published+bookid.split('-').slice(0,2).join('-') +'/'+bookid+'.html';

  // render data into new html
  var bookHTML = build_html(bookobj, config);
  // output HTML to published folder
  fs.write(book_dest, bookHTML);

  // compile, minify and copy over CSS files
  processCSS(config);

  // copy over cover
  var cover_src = config.paths.base+config.paths.work_assets + 'covers/' + bookid.replace(/-en$/, '')+'.png';
  var cover_dest = config.paths.base+config.paths.completed_assets + 'covers/' + bookid.replace(/-en$/, '')+'.png';
  if (fs.exists(cover_src)) fs.copy(cover_src, cover_dest);








}
function ocnTranslate(bookid, opTransFile) {
  if (!opTransFile) opTransFile = 'Google Translate';
  log('Translating file '.green+ bookid.red +' using '.green+ opTransFile.red);
}
function ocnReport(opFilename) {
  log('Generating new report '.green+ (opFilename? 'to '.green + opFilename.red:''));

}
function ocnProgressLog(entry) {
  log('Adding progress log entry: '.green+ entry.red);

}
function ocnAccentsLog(bookid) {
  log('Generate Accents report for book: '.green+ bookid.red);

}
function ocnEditLibraryBook(bookid, opTitle, opAuthor, opPriority) {
  function editLibrary(bookid, opTitle, opAuthor, opPriority) {
    //opPriority = String(opPriority);
    log("Editing book entry".green +' '+bookid.red+ ' author: '.green + opAuthor.red +
      ' title: '.green + opTitle.red+ ' priority: '.green+ opPriority.red);
  }
  var questions = [];
  if (!opTitle) questions.push({type: "input", name: "opTitle", message: "What is the book title?"});
  if (!opAuthor) questions.push({type: "input", name: "opAuthor", message: "Who is the Book's Author (short form)?"});
  if (!opPriority) questions.push({type: "input", name: "opPriority", message: "What is the book's priority?"});
  if (questions.length===0) {
    editLibrary(bookid, opTitle, opAuthor, opPriority);
  } else inquirer.prompt(questions, function( answer ) {
    if (answer.opTitle) opTitle=answer.opTitle;
    if (answer.opPriority) opPriority=answer.opPriority;
    if (answer.opAuthor) opAuthor=answer.opAuthor;
    editLibrary(bookid, opTitle, opAuthor, opPriority);
  });
}



// =================================
// Command parsing
program
  .version(app_ver)
  .description("Ocntools is a collection of scripting tools to aid in the proofing and building of the Ocean library.")
  .option('-v, --verbose', 'Allow console output', 0);
program.command('import <filename> [targetdirectory]')
  .description('Import new text file from raw folder (1.) to proofing (2.)').action(ocnImport);
program.command('build <bookid>')
  .description('Generate translation from textfile or Google Translate').action(ocnBuildBook);
program.command('translate <bookid> [transfile]')
  .description('Publish with span-wraped words and sentences').action(ocnTranslate);
program.command('getdictionary')
  .description('Update Accents Dictionary').action(ocnAccentsDictionary);
program.command('report [filename]')
  .description('Rebuild progress report').action(ocnReport);
program.command('progresslog <entry>')
  .description('Add progress log entry in the report').action(ocnProgressLog);
program.command('accents <bookid> [logfile]')
  .description('Builds accents report log for book <bookid> (default location is folder 3.)').action(ocnAccentsLog);
program.command('library <bookid> [title] [author] [priority]')
  .description('Add or edit book entry in library.config').action(ocnEditLibraryBook);
program.parse(process.argv);

// =================================
// Helper Functions

function log(str) {
  if (program.verbose) console.log(str);
}

function load_library_config() {
  var config;
  config = fs.readJSON('./library-config.json');
  config.books = fs.readJSON(config.paths.base + config.paths.library_books);
  config.templates = loadTemplates();
  return config;
}
function save_library_books(config) {
  var books = JSON.stringify(config.books);
  var path = config.paths.base + config.paths.library_books;
  //fs.createReadStream(path).pipe(fs.createWriteStream(path+'.bak'));
  fs.copy(path, path+'.bak', true);
  //fs.writeFileSync(path, books);
  fs.write(path, books);
}
function processCSS(config) {
  // compile, minify and copy over all CSS files

}
function parse_final_book_html(bookdata, config){
  var $ = cheerio.load(bookdata);
  var bookobj = {};

  // parse metadata
  var meta = $('meta[name=description]').data();
  meta.description = $('meta[name=description]').attr('content');
  if (!meta.description.length) console.log("Warning: ".red + "book does not have a description, see: ".green +
     "<meta name='description' content=''... ".white );
  if (!meta.language) meta.language='en';

  // meta data for Alignment and Terms
  if (!meta.alignmentURL) meta.alignmentURL='';
  if (!meta.termsDictionary) meta.termsDictionary='';

  meta.documentStage='Published';

  // fix: se>shoghi on old ocean books
  if (/se\-(.*?\-.*?)/.test(meta.bookid)) meta.bookid = meta.bookid.replace(/se\-(.*?\-.*?)/, 'shoghi-$1');

  if (!meta.bookid) {
    if(meta.docid) {meta.bookid = meta.docid; delete meta.docid;}
    else {
      // generate author code
      var author = meta.author;
      if (!author) {
        console.log("Failure: ".red + "book must have an author to proceed, see: .".green + "data-author=''".white);
        return '';
      }
      if (author.match(/shoghi/i)) author = 'shoghi';
       else if (author.match(/abd/i)) author = 'abd';
       else if (author.match(/bah[aá]/i)) author = 'baha';
       else if (author.match(/b[aá]b/i)) author = 'bab';
       else if (author.match(/universal house/i)) author = 'uhj';
       else if (author.match(/comp/i)) author = 'comp';
       else author = author.split(' ').pop().toLowerCase().substring(0,8);
      // create acronym
      var acr = meta.title.toLowerCase().split(' ').filter(function(word){
        var cpos = 'about,above,across,after,against,around,at,before,behind,below,beneath,beside,besides,between,'+
        'beyond,by,down,during,except,for,from,in,inside,into,like,near,of,off,on,out,outside,over,since,through,'+
        'throughout,till,to,toward,under,until,up,upon,with,without'+ ',and,the,is,are,an,a'
         .split(',');
        return (cpos.indexOf(word) === -1);
      }).map(function(word){
        return word.substring(0,1);
      }).join('').substring(0,4);
      meta.bookid = author+'-'+acr+'-'+meta.language;
    }
  }
  // if not publisher given, detect common Baha'i authors for Ocean
  if (!meta.publisher) {
    if (meta.author.match(/shoghi|baha|bab|báb|abd|qur/i)) meta.publisher = 'Ocean:bahai-education.org';
      else meta.publisher = 'FFA:firm-foundation.org';
  }
  meta.brand = meta.publisher.split(':')[0];
  meta.publisherUrl = meta.publisher.split(':')[1];


  // for optional values, assign emtpy string if missing
  if (!meta.titleShort) meta.titleShort = '';
  if (!meta.subtitle) meta.subtitle = '';
  // for weight, organize by author or category
  if (!meta.weight) {
    var auth = meta.bookid.split('-').shift();
    if (['bab','baha'].indexOf(auth)>-1) meta.weight = 1;
     else if (['abd'].indexOf(auth)>-1) meta.weight = 2;
     else if (['shoghi', 'comp'].indexOf(auth)>-1) meta.weight = 3;
     else if (['muhammad','muh','qur','quran'].indexOf(auth)>-1) meta.weight = 4;
     else if (['bible','gita','torah','pali','hadith','guru','tao', 'sacred'].indexOf(auth)>-1) meta.weight = 5;
      else meta.weight = 10;
  }
  if (!meta.acronym) meta.acronym = meta.bookid.split('-')[1];
  if (!meta.authorCode) meta.authorCode = meta.bookid.split('-')[0];
  if (!meta.logo) meta.logo = meta.publisher.toLowerCase() + (meta.language!='en'?'-'+meta.language:'') + '-logo.svg';
  if (!meta.cover) meta.cover = meta.acronym + (meta.language!='en'?'-'+meta.language:'') + '.png';
  meta.langinfo = lang.getLanguageInfo(meta.language);

  // calcualte missing fields
  if (!meta.originalBookid) {
    meta.originalBookid = meta.bookid; meta.originalLanguage = meta.language; meta.translator ='';
  }
  if (!meta.translator) meta.translator = '';
  if (meta.language === 'en') {
    meta.authorEnglish = meta.author;
    meta.titleEnglish = meta.title;
  }
  if (meta.publisher.split(':').shift()==='Ocean') {
    if (!meta.publishedSource) meta.publishedSource = '© Bahá’í International Community:reference.bahai.org';
    if (!meta.subject) meta.subject='Religion:Bahá’í';
  }
  meta.source = meta.publishedSource.split(':')[0];
  meta.sourceUrl = meta.publishedSource.split(':')[1];

  // split html up into sections ($.html() grabs outerHTML)
  var sections = [];
  $('section').not('.titlepage,.contents').each(function() { sections.push($.html(this)); });
  // with each section extract components
  sections.some(function(section_html, index) {
    var section = {}, classes; //
    $ = cheerio.load(section_html);
    // parse out section content
    section.content = [];
    $('div.par, p, .subhead, hr, .section, aside.fn').each(function(index) {
      var obj = parse_content_block($.html(this), config, meta);
      obj.index = index;
      section.content.push(obj);
    });

    // parse out section header
    section.data = [];
    section.meta = $('section').data();
    section.meta['content'] = $('section').hasClass('content');
    section.id = $('section').attr('id');
    section.header = {};
    section.header.classes = [];
    if ($('section div.section_header').attr('class')) {
      section.header.classes = $('section div.section_header').attr('class').split(/[\s]+/)
        .filter(function(str){ return str != 'section_header'; });
    }
    //list of headers;
    section.header.headers = [];
    $('section').find('div.section_header h3').each(function(index) {
      var obj = {
        classes: [],
        title:   $(this).html().trim(),
        id:      section.id +'_'+ index
      };
      if ($(this).attr('class')) {
        obj.classes = $(this).attr('class').trim().split(/[\s]+/);
        obj.type = obj.classes.shift();
      }
      section.header.headers.push(obj);
    });


/*
    section.header.headers = [];
    if (headers = $('section').find('div.section_header').html()) {
      var headers = cheerio.load(headers);
      section.header.headers = headers.split("\n")
      .map(Function.prototype.call, String.prototype.trim)
      .filter(function(str){ return str.length; })
      .map(function(str, index){
        var item = {};
        item.classes = str.replace(/<h3[\s]+class=["'](.*?)["'].*?<\/h3>/, '$1').trim().split(/[\s]+/)
            .map(Function.prototype.call, String.prototype.trim);
        item.type = item.classes.shift();
        item.title = decodeEntities(str.replace(/<h3.*?>(.*?)<\/h3>/, '$1').trim());
        return item;
      });
    }*/
    section.classes = $('section').attr('class').split(/[\s]+/)
      .filter(function(str){ return str != 'content'; });
    section.meta['sectiontype'] = section.classes.shift();
    for (var property in section.meta) {
      if (section.meta.hasOwnProperty(property)) {
        section.data.push({'name': property, 'value': section.meta[property]});
      }
    }
    sections[index] = section;
  });


  bookobj.meta = meta;
  bookobj.sections = sections;

  return bookobj;
}

function renumber_word_ids(html) {
  var number = 0;

  /*
  $ = cheerio.load(html);
  $('.w').each(function() {
    id = $(this).attr('id');
    number++;
    html = html.replace("'"+id+"'", "'w"+ number +"'");
  });*/

  html = html.replace(/'_word_id_'/gi, function (){return "'_"+ (number++).toString(36) +"'" ;});

  return html;
}

function build_html(book, config) {
  var content = [];
  book.sections.forEach(function(section){
    content.push(build_section(section, config, book.meta));
  });
  book.bookcontent = content.join("\n\n\n\n");

  book.config = config;
    // generate table of contents
  //var book.toc = decodeEntities(build_toc(html));
  book.toc = '';
  // apply to book template
  var html = mark.up(config.templates.ocean_book, book);

  // run entire content through re-numbering routine for expiremental numbering
  html = renumber_word_ids(html);

  return html;
}
//context.bookcontent = decodeEntities(content);
function build_section(section, config, meta) {
  var html = '';
  // wrap each header title in a language block
  section.header.headers.forEach(function(obj, index){
    section.header.headers[index].title = build_languageblock(obj.title, obj.id, config, meta);
  });
  section.content.forEach(function(obj, index){
    section.content[index] = build_content_block(obj, config, meta);
  });
  section.bookmeta = meta; // don't use this at the moment
  // for language or author overrides?
  html = mark.up(config.templates.section, section);
  return html;
}
function  build_content_block(obj, config, meta) {
  var result = '';//  >>> unidentified >>> "+JSON.stringify(obj);
  if (obj.type === 'subhead') {
    obj.content = build_languageblock(obj.content, obj.id, config, meta);
    result = mark.up(config.templates.subheader, obj);
  } else if (obj.type === 'section') {
    obj.content = build_languageblock(obj.content, obj.id, config, meta);
    result = mark.up(config.templates.sectionheader, obj);
  } else if (obj.type === 'footnote') {
    obj.content = build_languageblock(obj.content, obj.id, config, meta);
    result = mark.up(config.templates.aside, obj);
  } else if (obj.type === 'par') {
    obj.content = build_languageblock(obj.content, obj.id, config, meta);
    result = mark.up(config.templates.paragraph, obj);
  } else if (obj.type === 'rule') {
    result = mark.up(config.templates.rule, obj);
  }
  if (result === '') console.log('Warning, unidenfitied block: '.red+ JSON.stringify(obj));
  return result;
}
function parse_content_block(html, config, meta) {
  var $ = cheerio.load(html);
  var block = {}, index;
  // detect block type - p, div.p, .section, .subhead, hr, aside.fn
  // for paragraphs, parse contents
  var tag = $('*').get(0).tagName;
  if ($(tag).hasClass('subhead')) block.type = 'subhead';
   else if ($(tag).hasClass('section')) block.type = 'section';
   else if (tag==='hr') block.type = 'rule';
   else if (tag==='aside') block.type = 'footnote';
   else block.type = 'par';
  block.id = $(tag).attr('id');
  // get classes list, remove par, section and subhead
  block.classes = ($(tag).attr('class') ? $(tag).attr('class').split(/\s+/) : []);
  if (index = (block.classes.indexOf('par') || block.classes.indexOf('section')
       || block.classes.indexOf('subhead') || block.classes.indexOf('fn')) ) {
    block.classes.splice(index, 1);
  }
  // get data object array
  block.data = [];
  block.meta = $(tag).data();
  for (var property in block.meta) {
    if (block.meta.hasOwnProperty(property)) {
      block.data.push({'name': property, 'value': block.meta[property]});
    }
  }
  // gather any block content
  block.content = $(tag).html().trim();

  return block;
}

function build_toc(html) {
  var $ = cheerio.load(html);
  var toc='', title, id = '', section_num = '', date, level, toc_level, next_id, next_id_disp;
  $(".toc, .toc2, .toc3").each(function(i) {
    var isSectionHeader = ($(this).hasClass('section_header'));
    if (isSectionHeader) title = $(this).find('.title').html();
     else title = $(this).html().trim() ? $(this).html().trim() : $(this).data('title').trim();

    // some .section headers will have section numbers, like chapter number
    section_num = '';
    if (isSectionHeader) section_num = $('#'+$(this).attr('id').slice(0, - 1)).data('sectionnum');
     else section_num = $(this).data('sectionnum') ? $(this).data('sectionnum') : '';
     section_num = section_num ? "<span class=''>" + section_num +'.</span> ' : '';

    // next_id is the first paragraph of the section or following the subheader
    if ($(this).tagName==='SPAN') next_id = $(this).parent('p').attr('id');
     else next_id = $(this).nextAll('p[id], div[id].par').first().attr('id');
     next_id_disp = next_id ? " &nbsp; <span class='ref'> (" + next_id +')</span> ': '';

     if ($(this).hasClass('nonum')) next_id_disp = '';

    // get id to for linking
    id = $(this).attr('id');
     id = id ? id : next_id; // link to next par id if we don't have a header id

    // letters and talks may have dates
    if (isSectionHeader) date = $('#'+$(this).attr('id').slice(0, - 1)).data('date');
     else date = $(this).data('date');
    date = date ? "<span class='date'> - " + date + '</span>' : '';

    // if we have sub-headers, indent by setting them level to 'second'
    level = ($(this).hasClass('section') || $(this).hasClass('header')) ? 'toc_first' : 'toc_second';
     if ($(this).hasClass('toc')) level = 'toc_first';
      else if ($(this).hasClass('toc2')) level = 'toc_second';
       else if ($(this).hasClass('toc3')) level = 'toc_third';

    // build TOC item if we had at least a title and in id to link to
    if (title && id) toc = toc + "<li class='"+level+"'>"  +
       section_num + " <a href='#" + id + "' title='" + title + "'>" + title + "</a>"+ date + next_id_disp + "</li>";
  });

  if (toc.length>1) {
    // pull table of contents title from section attribute to make it easy to translate or modify
    toc_title = '<h2 class="section">'+$("#section_toc").data('title')+'</h2>';
    toc = toc_title + '<ul>' + toc + '</ul>  <hr class="screenonly">';
  }

  return toc;
}

function decodeEntities(html) {

  // gather and translate all numeric entities
  var list = html.match(/\&\#x.*?\;/g);
  if (list) {
    list = list.sort().filter(function(item, pos, ary) { return !pos || item != ary[pos - 1]; });
    list.forEach(function(item, index) {
      var re = new RegExp(item, 'g');
      html = html.replace(re, String.fromCharCode(parseInt(item.replace(/[&#x;]/g, ''), 16)));
    });
  }
  // verify success
  if (/&#x.*?;/.test(html)) {
    console.log('Warning: '.red + "Some unresolved html entities still detected. ", html);
    console.log ("Replace list: ", list.join(', '), "\n\n");
  }

  html= html.replace(/&apos;/g, "'");
  html= html.replace(/&quot;/g, '"');

  // gather and translate all standard entities
  var index;
  list = html.match(/\&[a-z]+\;/g);
  if (list) {
    list = list.sort().filter(function(item, pos, ary) { return !pos || item != ary[pos - 1]; });
    if ((index = list.indexOf('&amp;'))>-1) {
      console.log("Deleting list item: "+index+" "+list[index]);
      list.splice(index, 1); // why is this not deleting?
    }
    list.forEach(function(item, index) {
      var re = new RegExp(item, 'g');
      //html = html.replace(re, String.fromCharCode(parseInt(item.replace(/[&#x;]/g, ''), 16)));
    });
    if (list.length) console.log("Warning: ".red + "found some dangling HTML entities: ", list.join(', '));
  }

  return html;
}

function build_languageblock(text, id, config, meta) {
  text = text.replace(/class="(.*?)"/g, "class='$1'");
  // TODO: fix any other parsing glitches?  data-page=?  footnotes?
  text = decodeEntities(text);

  // span-id wrap all words
  if (id /*&& text.split(' ').length>3*/) text = spanidwrapwords(text, id);

  var context = {
    langinfo: meta.langinfo,
    language: meta.language,
    content: text
  };
  // if span.block found, loop through and process text
  // else process text

  return mark.up(config.templates.language_content, context);
}

/*
  Tokenize words and wrap each in a span
 */
function spanidwrapwords(text, id, totalcount) {
  var tokens = ocnparse.tokenizeString(text);
  var word_count = 0;
  var sent_count = 1;
  var words = [];
  var prev = '';
  tokens.forEach(function(token) {
    if (token.word.trim().length>0) {
      if (isNewSentence(token, prev) && word_count>10) {word_count=1; sent_count++;
        //console.log("New Sentence: ", prev, token);
      }
       else word_count++;
      //token.id = id +'-'+ sent_count +'.'+ word_count;
      token.id = '_word_id_'; // test: replacing all out later with a single regex
      prev = token;
    }
  });
  // step through tokens with and add any other fields
  tokens.forEach(function(token) {
    if (token.id) token.word = "<w id='"+token.id+"'>"+token.word+"</w>";
    words.push(token.prefix + token.word + token.suffix);
  });
  return words.join('');
}



/*
   Load object containing all templtes in the ./templates folder
 */
function loadTemplates() {
  // load all templates in the templates folder
  var templates = {};
  fs.expand("templates/*.tpl.html").forEach(function(item, index) {
    var name = item.replace(/templates\/(.*?)\.tpl\.html/, '$1');
    templates[name] = fs.read(item);
  });
  return templates;
}



/*
   Given two tokens, determine if the token is likely the first word of a new sentence.
 */
function isNewSentence(token, prev) {
  if (!prev) return true;
  var isCaps = token.word.slice(0,1)===token.word.slice(0,1).toUpperCase();
  var endPunc = prev.suffix.match(/[!?]/) || token.prefix.match(/[!?]/);
  var endPeriod = prev.suffix.match(/[.]/) || token.prefix.match(/[.]/);
  var prevLength = prev.word.length;
  var prevAbbr = isAbbrv(prev.word); ///^(mr|mrs|dr)$/i.test(prev.word);
  if (isCaps && endPunc) return true;
  if (isCaps && endPeriod && (prevLength>1 && !prevAbbr)) return true;
  return false;
}
/*
    Match word agaisnt large list of English common abbreviations. Helpful for determining if a full stop is a sentence ender.
 */
function isAbbrv(word) {
  var abbv = "^(abbr|abr|acad|adj|adm|adv|agr|agri|agric|anon|app|approx|assn|bact|bap|bib|bibliog|biog|biol|bk|bkg"+
    "|bldg|blvd|bot|bp|brig|gen|bro|bur|cal|cap|capt|cath|cc|cent|cf|ch|chap|chem|chm|chron|cir|circ|cit"+
    "|civ|clk|cm|co|col|colloq|com|comdr|comr|comp|con|cond|conf|cong|consol|constr|cont|cont|contd|corp"+
    "|cp|cpl|cr|crit|ct|cu|cwt|dec|def|deg|dep|dept|der|deriv|diag|dial|dict|dim|dipl|dir|disc|dist|dist"+
    "r|div|dm|do|doc|doz|dpt|dr|dup|dupl|dwt|ea|eccl|eccles|ecol|econ|ed|elec|elect|elev|emp|enc|ency|en"+
    "cyc|encycl|eng|entom|entomol|esp|est|al|etc|seq|ex|exch|exec|lib|fac|fax|fed|fem|ff|fol|fig|fin|fl|"+
    "fn|fr|ft|fwd|gm|gal|gall|gaz|gen|geog|geol|geom|gloss|gov|govt|gr|gram|hab|corp|her|hist|hort|hr|ht"+
    "|ib|ibid|id|illus|imp|in|inc|loc|cit|ins|inst|intl|introd|is|jour|jr|jud|kg|kilo|km|kt|kw|lab|lang|"+
    "lat|lb|lib|lieut|lt|lit|ltd|lon|long|mach|mag|maj|mas|masc|math|mdse|mech|med|mem|memo|mfg|mfr|mg|m"+
    "g|mgm|mgr|mi|misc|ml|ml|mm|mo|mod|ms|mss|mt|mts|mus|nn|narr|natl|nav|neg|no|seq|pag|obit|obj|op|cit"+
    "|orch|orig|oz|pp|par|pat|patd|pct|pen|perf|philos|phys|pl|ppd|pref|prin|prod|tem|pron|pseud|psych|p"+
    "sychol|pt|pub|publ|pwt|qr|qt|qt|qtd|ques|quot|rbi|RBI|quot|rec|ref|reg|rel|rev|riv|rpm|rps|rpt|sc|s"+
    "ch|sci|sculp|sculp|sec|secy|sect|ser|serg|sergt|sgt|sic|sing|sol|sp|sq|sub|subj|sup|supt|surg|sym|s"+
    "yn|tbs|tbsp|tel|temp|terr|theol|topog|trans|tr|treas|trig|trigon|tsp|twp|ult|univ|usu|uv|var|vb|ver"+
    "s|vet|viz|vet|vol|vox|pop|vs|vs|vss|wpm|writ|wt|yd|yr|zn|mr|ms|mrs|sir)$";
  var re = new RegExp(abbv, 'i');
  return re.test(word);
}

