
// simple library for browser proof-of-concept vocabulary assessment

var CARDS = {};
var ASSESS ={};
var _WORDS_PER_CARD = 5;
var _TIME_PER_CARD = 15000; // milliseconds, should probably be around 6000
var _INITIAL_CARDCOUNT = 11; // how many cards for the first level (decreases with each level)


// after loading raw json, we need to format the object to have a levels lookup object
function format_cards(json) {
  var w, cards = json;
  cards.levels = {};
  for (w in cards.words) if (cards.words.hasOwnProperty(w)) {
    var obj = cards.words[w];
    //obj.word = w;
    if (!cards.levels.hasOwnProperty(obj.level)) cards.levels[obj.level] = [w];
     else cards.levels[obj.level].push(w);
  }
  return cards;
}

// determine pass, fail or continue (FALSE) for this test level
function checkLevelComplete(totalCards, correct, incorrect) {
  var result = false;
  if (totalCards === 3) { // 2/1
    if (correct >= 2) result = "pass"; else if (incorrect >= 1) result = "fail";
  } else if (totalCards === 5) { // 3/2
    if (correct >= 4) result = "pass"; else if (incorrect >= 2) result = "fail";
  } else if (totalCards === 7) { // 4/3
    if (correct >= 4) result = "pass"; else if (incorrect >= 3) result = "fail";
  } else if (totalCards > 7) { // 70%/30%
    if ((correct / totalCards * 100) > 69) result = "pass";
     else if ((incorrect / totalCards * 100) > 29) result = "fail";
  }
console.log('checkLevelComplete', 'cards: '+totalCards, ', correct '+correct, ', incorrect: '+incorrect, ', result: '+result);
  return result;
}


// return a random set of cards for a given level
function randomWordObjs(level, count) {
  //console.log("randomWordObjs", level, count);
  if (!count) count = 1;
  var result = {};
  var levelarray = CARDS.levels[level];
  do {
   var word = levelarray[Math.floor(Math.random()*levelarray.length)];
   if (!result[word]) result[word] = shuffleArray(CARDS.words[word].syn); // shuffle each word's synonym order
  } while (Object.keys(result).length < count);
  //console.log(' randomWordObjs result:', result);
  return result;
}
// gather a batch of flashcards for a given level
function fetchNewQueryCards(level, cardcount, wordspercard) {
  //console.log("fetchNewQueryCards", level, cardcount, wordspercard);
  if (!wordspercard || wordspercard<3 || wordspercard>10) wordspercard = 6;
  if (!cardcount || cardcount<2 || cardcount>10) cardcount = 3;
  if (cardcount === 0 || !!(cardcount && !(cardcount%2))) cardcount++; // if even number, add one
  var result = [];
  var cards = randomWordObjs(level, wordspercard*cardcount);
  var keys = Object.keys(cards);
  for (var i=0; i<keys.length; i++) {
    var cardNum = Math.floor(i/wordspercard);
    var word = keys[i];
    if (!result[cardNum]) result[cardNum] = {};
    result[cardNum][word] = cards[word];
  }
  return result;
}

function stopBackgroundAnimation(selector) {
  $(selector).removeAttr( 'style' ).parent().removeAttr( 'style' );
  $(selector).stop(true);
}
function startBackgroundAnimation(duration, selector, word, completed, progress) {
  stopBackgroundAnimation(selector);
  $(selector).animate({width:'100%'}, {
    duration: duration,
    easing:'linear',
    step:function(a,b){
      $(this).parent().css({ background:'linear-gradient(to right, #9b9 0%,#9b9 '+a+'%,#fff '+a+'%,#fff 100%)' });
      if (progress) progress();

    },
    complete: function(){
      console.log('Completed animation for word: '+word);
      completed(0, word); // we pass the card id to make sure the card is still current
    }
  });
}

function uniqueArray(a) {
  var seen = {};
  var out = [];
  var len = a.length;
  var j = 0;
  for(var i = 0; i < len; i++) {
    var item = a[i];
    if(seen[item] !== 1) {
      seen[item] = 1;
      out[j++] = item;
    }
  }
  return out;
}

function quickHash(str){
  var hash = 0, i, chr, len;
  if (str.length === 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function shuffleArray(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}


/*



  var synassess = function(testlevel, queries, num) {
    if (!num) num = 6;
    if (!queries) queries = 3;
    if (queries === 0 || !!(queries && !(queries%2))) queries++; // if even number, add one
    var excludeList = [];
    console.log(" synassess testing "+ queries+" queries at level "+testlevel);
    var totalcorrect = 0, totalincorrect = 0;
    for (var i=0; i<queries; i++) {
      var testcards = random_word_objs(cards, testlevel, num, excludeList);
      var words = Object.keys(testcards);
     // var correctItem, correctWord;
      // grab a random word from the group so long as the word has not already been used
     // do {
      var correctItem = Math.floor(Math.random()*words.length);
      var correctWord = words[correctItem];
     // } while (prevcards.indexOf(correctWord)>=0);
      //console.log(" Test level ", testlevel.toString().red);
      var choices = [];
      words.forEach(function(word){ choices.push(testcards[word].join(', ')); });
      //console.log('choices words: ', choices);
      var answer = readlineSync.keyInSelect(choices,
        ' Which is most closely related to ' + correctWord.green, {cancel:false});
      var pass = (answer === correctItem);
      if (pass) totalcorrect++; else totalincorrect++;
      console.log(pass ? "... correct".green : "... incorrect".red);
      var ss = queryShortCircuit(queries, totalcorrect, totalincorrect);
      if (ss) {
        console.log("  Short circuiting set of "+queries+" tests at number "+ (i+1), ss.red);
        success = (ss==='pass');
        break; // leave this loop
      }
      excludeList.push(correctWord);
    }
    console.log("At level "+testlevel+" you got "+totalcorrect+" correct out of "+queries+". ",
    success ? "pass".green : "fail".red);
    return success;
  };

  // assessment test
  console.log('\033[2J');
  var ceiling = 98, floor = 2, testlevel = Math.round((ceiling-floor)/2), level;
  var round = 1, queries;
  do {
    console.log('=============================');
    console.log(' Floor:', floor, "Ceiling:", ceiling);
    testlevel = Math.round((ceiling - floor)/2)+floor;
    // note: first assessment is 7 tests, second is 5, remaining are 3
    if (round===1) queries = 10; else if (round===2) queries=7; else queries=5;
    var pass = synassess(testlevel, queries, 5);
    if (pass) console.log(" Correct".green); else console.log(" Incorrect".red);
    if (pass) {
      level = testlevel;
      floor = testlevel;
    } else ceiling=testlevel-1;
    round++;
  } while (ceiling>floor);
  console.log('=============================');
  console.log("You assessed at level: ", testlevel.toString().green);
  console.log('=============================\n\n');

}
*/




