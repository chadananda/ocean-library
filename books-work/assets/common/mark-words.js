/*   Mark Words   */
// For text that is split up with <w> wrappers
// adds a class 'term' to any word that looks like it might be a Baha'i term
//

// Shorthand for $( document ).ready()
$(function() {
    // add the requisite CSS
    $('head').append('<link rel="stylesheet" type="text/css" '+
      'href="https://dl.dropboxusercontent.com/u/382588/ocean2.0/'+
      'Library/books-work/assets/common/mark-words.css">');

    markTerms();
});

function markTerms() {
  $('w[id]').each(function(){
    var word = $(this).html();
    if (isPossibleTerm(word)) $(this).addClass('term');
  });
}


function isPossibleTerm(word) {
  word = word.replace(/<div.*?<\/div>/, ''); // not sure why I need to do this

  // remove quotes from either side
  word = word.trim().replace(/^[\’\‘\'\`\-]/mg, '').replace(/[\’\‘\'\`\-]$/mg, '');
  // stripped down version must be at least two characters
  if (term_strip_alpha(word).length<2) return false;
  // word must contain some non-normal characters beside just one dash
  // if it contains dashes, it must have at least some other special character
  var stripped = word.replace(/[a-zA-Z]/g, '');
  console.log(word +', "'+ stripped+'"');
  if (stripped==='' || stripped==='-' || stripped==='--' || stripped==='---') {
    return false;
  }
  // first, see if it has our special characters
  if (word.search(/[áÁíÍúÚḤḥḌḍṬṭẒẓṢṣ\’\‘\'\`\-]/g) === -1) return false;
  // next, remove illegal characters and see if anything changed
  //  first, remove any tags
  var src = word.replace(/(<([^>]+)>)/ig, '')
  // next, remove all not allowed characters
  var modified = src.replace(/[^a-zA-ZáÁíÍúÚḤḥḌḍṬṭẒẓṢṣ\’\‘\'\`\-]/g, '').replace(/[eo]/g, '');
  // if no change after deleting not allowed characters, this might be a term
  return (src === modified);
};

function term_strip_alpha(word) {
  if (!word) return '';
  return word
    // replace accented vowels
    .replace(/\á/g, 'a')
    .replace(/\í/g, 'i')
    .replace(/\ú/g, 'u')
    .replace(/\Á/g, 'A')
    .replace(/\Í/g, 'I')
    .replace(/\Ú/g, 'U')
    // replace dot-unders with regular letters
    .replace(/\Ḥ/g, 'H')
    .replace(/\ḥ/g, 'h')
    .replace(/\Ḍ/g, 'D')
    .replace(/\ḍ/g, 'd')
    .replace(/\Ṭ/g, 'T')
    .replace(/\ṭ/g, 't')
    .replace(/\Ẓ/g, 'Z')
    .replace(/\ẓ/g, 'z')
    .replace(/\Ṣ/g, 'S')
    .replace(/\ṣ/g, 's')
    // remove all HTML tags
    .replace(/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g, '')
    // delete quotes and line unders
    .replace(/[\’\‘\'\`\_]/g, '')
    // delete dashes
    .replace(/[\-]/g, '')
    .trim(); // just in case
};