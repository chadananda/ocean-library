// Demonstration of extracting a table of contents from
// Ocean formatted HTML

$(function() {
  // the the toc section is shown, generate table of contents
  if ( $('section_toc').is(":visible")) {

    var toc='', title, id = '', section_num = '', date, level, toc_level, next_id, next_id_disp;

    $(".toc, .toc2, .toc3, .toc4").each(function(i) {

      var isSectionHeader = ($(this).hasClass('section_header'));

      if (isSectionHeader) title = $(this).find('.title').html();
       else title = $(this).html().trim() ? $(this).html().trim() : $(this).data('title').trim();

      // some .section headers will have section numnbers, like chapter number
      section_num = '';
      if (isSectionHeader) section_num = $('#'+$(this).attr('id').slice(0, - 1)).data('sectionnum');
       else section_num = $(this).data('sectionnum') ? $(this).data('sectionnum') : '';
       section_num = section_num ? "<span class=''>" + section_num +'.</span> ' : '';

       //console.log(section_num);

      // next_id is the first paragraph of the section or following the subheader
      if ($(this).prop("tagName")==='SPAN') next_id = $(this).parent('p').attr('id');
       else next_id = $(this).nextAll('p[id]:first, div[id].par:first').attr('id');
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
          else if ($(this).hasClass('toc4')) level = 'toc_fourth';

      // build TOC item if we had at least a title and in id to link to
      if (title && id) toc = toc + "<li class='"+level+"'>"  +
         section_num + " <a href='#" + id + "' title='" + title + "'>" + title + "</a>"+ date + next_id_disp + "</li>";

    });

    if (toc.length>1) {
      // pull table of contents title from section attribute to make it easy to translate or modify
      toc_title = '<h2 class="section">'+$("#section_toc").data('title')+'</h2>';
      //
      $("#section_toc").html(toc_title + '<ul>' + toc + '</ul>  <hr class="screenonly">');
      $("#section_toc li a").click(function(){
        var target = $(this).attr('href').replace(/\#/, '');
        document.location.hash = target;
        return false;
      });
    } else $('#section_toc').hide();

 }

});