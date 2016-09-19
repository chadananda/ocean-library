/*   Flag Words   */
// For text that is split up with ids
// adds a class 'audioflag' to word as well as a data-tooltip with a message
// flags persist to local storage (pouchdb) and sync with cloud storage (couchdb)
//

/*
 Requires:
  Jquery
  PouchDB:
    (https://cdnjs.cloudflare.com/ajax/libs/pouchdb/5.1.0/pouchdb.js)
  flagwords.css:
    (https://dl.dropboxusercontent.com/u/382588/ocean2.0/Library/books-work/assets/common/flagwords.css)


  Example:

  <script src='assets/common/flagwords.js'></script>
  <link rel="stylesheet" type="text/css" href="assets/common/flagwords.css">
  <script src='https://cdnjs.cloudflare.com/ajax/libs/pouchdb/5.1.0/pouchdb.min.js'></script>

  <script>
    $(function() {
      var bookid = $('meta[name=description]').data("title"); // for ocean-formatted books
      var dbname = 'audioflags-test'; // 'audioflags'
      var remoteDB = 'https://diacritics.iriscouch.com:6984/audioflag-test';
      // var remoteDB = 'https://diacritics.iriscouch.com:6984/audioflags';
      var flags = new AudioFlags();
      flags.init(bookid, dbname, remoteDB);

      // add some flags:
      flags.addFlag('_4', 'this is a test', '1:32:45');
      flags.addFlag('_6', 'this is another test', '1:32:46');
      flags.addFlag('_8', 'this is yet another test', '1:32:47');
      flags.addFlag('_a', 'this is still yet another test', '1:32:48');

      // remove flags
      flags.removeFlag('_a'); flags.removeFlag('_8');
      // clear entire DB with flags.clearDB();

      // to get a flag, just use the id
      flags.flags[id];
    });
  </script>

 */


function AudioFlags() {
  // Avoid clobbering the window scope, return a new object if we're in the wrong scope
  if (window === this) return new audioFlags();
  var self = this;
  return this;
}

AudioFlags.prototype = {
  init: function (bookid, dbname, remoteDB) {
    var self = this; //console.log('init', self);
    // implementation
    self.bookid = bookid;
    self.dbname = dbname;
    self.remoteDB = remoteDB;
    self.flags = {};
    // initialize DB
    self.db = new PouchDB(self.dbname);
    // later, let's set this up to live monitor for changes online
    self.loadFlags();
  },

  listFlags: function(){
    console.log('Flags: ', this.flags);
  },

  clearDB: function() {  // delete entire database for testing
    var self=this;
    self.db.allDocs({include_docs: true}).then(function (result) {
      result.rows.forEach(function(item){
        var flag = item.doc;
        self.db.get(flag._id).then(function(doc) {
          return self.db.remove(flag);
        });
      });
    });
  },

  loadFlags: function(bookid) {
    var self = this; //console.log('loadFlags', self);
    if (bookid) self.bookid = bookid; // to allow override when switching books
    self.flags = {}; // we'll reload them all
    self.db.allDocs({include_docs: true}).then(function (result) {
      result.rows.forEach(function(item){
        var flag = item.doc;
        if (flag.bookid === self.bookid) self.flags[flag.id] = flag;
      });
      self.showFlags(); // display all known flags
      self.syncFlags(); // run sync in the background, it will update if there are any changes

      $('body div.showflags').remove();
      $('body').append('<div class="showflags"> flags </div>');
      $('.showflags').click({obj: self}, self.allBookFlags);

      self.checkFlagsTimestamp();
    });
  },

  // updates timestamp of all flags and updates as necessary
  checkFlagsTimestamp: function () {
    var self = flags; //console.log('loadFlags', self);
    if ((typeof timestamps == 'undefined') || (Object.keys(timestamps).length<1)) { //ie, if not yet loaded call self again
      setTimeout(self.checkFlagsTimestamp, 2000);
      console.log('timetamps variable not ready, we will try again later...');
      return;
    }
    var flaglist = self.flags;
    var flag, w, id;
    var updated = 0;
    for (id in flaglist) {
      flag = flaglist[id];
      if (timestamps[flag.id]) {
        w = timestamps[flag.id];
        var timestamp = self.formatTimestamp(w.start);
        if (timestamp != flag.timestamp) {
          console.log("Flag needs updated. Was: "+flag.timestamp+', now: '+timestamp);
          console.log("Updating flag: "+id+', '+flag.message+', '+timestamp);
          self.addFlag(id, flag.message, timestamp);
          self.flags[id].timestamp = timestamp;
          updated++;
        }
      }
    }
    console.log('Updated '+updated+' timestamps.');
  },

  addFlag: function(id, message, timestamp) {
    var self = this;
    if (!id) return;

    if ((message === null || message === false)) return;

    if (message === '') { // if no message, remove Flag
      self.removeFlag(id);
      return;
    }
    var flag = {};
    if (self.flags.hasOwnProperty(id)) flag = self.flags[id];
    flag.message = message;
    flag.timestamp = timestamp;
    flag.id = id;
    flag.bookid = self.bookid;

    if (!flag.parid) { // load from DOM
      flag.parid = $('#'+id).parents('div.par').attr('id');
    }
    if (!flag.word) flag.word = $('#'+id).text(); // load from DOM

//console.log(flag);

    if (flag._rev) {  // if we have a ._rev, this is an update
      self.db.get(flag._id).then(function(doc) {
        return self.db.put(flag);
      }).then(function(response) {
        flag._rev = response.rev;
        self.flags[id] = flag;
        self.showFlags();
        self.syncFlags();
      });
    } else {  // else, this is a new record, we'll nee to get an ._id and ._rev
      self.db.post(flag).then(function (response) {
        flag._rev = response.rev;
        flag._id = response.id;
        self.flags[id] = flag;
        self.showFlags();
        self.syncFlags();
      });
    }
  },

  removeFlag: function(id) {
    var self = this;
    var flag = self.flags[id];
//console.log('removeFlag: ', flag);
    if (flag._id) {
      self.db.get(flag._id).then(function(doc) {
        return self.db.remove(flag);
      }).then(function (result) {
        delete self.flags[id];
        self.showFlags();
        self.syncFlags();
      });
    }
  },

  fetchFlag: function(id) {
    var self = this;
    if (self.flags[id]) return self.flags[id];
  },

  syncFlags: function(callback) {
    var self = this; //console.log('syncFlags', self);
    var book_flags_changed = false;
    // push any changes up
    PouchDB.replicate(self.dbname, self.remoteDB);
    // pull any changes down
    PouchDB.replicate(self.remoteDB, self.dbname).on('change', function(info) {
      if (info.doc.bookid === self.bookid) {
        self.flags[info.doc.id] = info.doc; // add new flag to flags object
        book_flags_changed = true;
      }
    });
    if (book_flags_changed) self.showFlags();
  },

  showFlags: function() {
    var escapeSelector = function(str) {
      if (str) return str.replace(/([ #;?%&,.+*~\':"!^$[\]()=>|\/@_])/g,'\\$1');
    };
    var self = this;
    // clear previous flags
    $('.audioflag').removeClass('audioflag').removeAttr('data-tooltip');
    for (var id in self.flags) {
      var flag = self.flags[id];
      var selector = '#' + escapeSelector(flag.id);
      //console.log('trying to mark selector: '+selector);
      // mark up all flagged words
      $(selector).addClass('audioflag').attr('data-tooltip', flag.message);
    }
    //allBookFlags();
  },

  formatTimestamp: function(seconds) {
    var date = new Date(0);
    date.setHours(0);
    date.setMilliseconds(seconds * 1000);
    return date.toTimeString().substr(0, 8) + '.' + Math.round(date.getMilliseconds()/10);
  },

  allBookFlags: function(data) {
    var self = data.data.obj;
    var flags = self.flags;
    var text = ''; var items = [];
    if (Object.keys(flags).length) {
      text = 'All audio flags ('+Object.keys(flags).length+') for book:  "'+self.bookid+'" \n';
      items = [];
      for (var id in flags) {
        var flag = flags[id];
        items.push(' Par '+flag.parid+', ('+flag.timestamp +') "'+ flag.word+'": '+flag.message);
      }
      // sort items by paragraph number
      items.sort(function(a, b){
        return ~~a.substring(5, a.indexOf(',')).trim()  -   ~~b.substring(5, b.indexOf(',')).trim();
      });
      text = text + items.join("\n");
      $('#endNotes').html('<textarea style="width:90%; height: 500px; font-family: courier">'+ text +"</textarea>"+
        "<br><br><br><br><br>");
      //scrollTo('#endNotes');
      $('body').scrollTo('#endNotes');
    } else text = 'This book has no flags. ';
    //alert(text);
  }

};



$.fn.scrollTo = function( target, options, callback ){
  if(typeof options == 'function' && arguments.length == 2){ callback = options; options = target; }
  var settings = $.extend({
    scrollTarget  : target,
    offsetTop     : 50,
    duration      : 500,
    easing        : 'swing'
  }, options);
  return this.each(function(){
    var scrollPane = $(this);
    var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
    var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
    scrollPane.animate({scrollTop : scrollY }, parseInt(settings.duration), settings.easing, function(){
      if (typeof callback == 'function') { callback.call(this); }
    });
  });
}










