## Ocean Scripting Tools

* ocntools>build (bookid)
       * rebuilds book, minifies and moves assets 
       * rebuilds summary html list
       * rebuilds completion status report at end of book list
          * complete status: text status, translation status
* ocntools>translate (bookid)
       * creates auto-translated versions of this book
* ocntools>translate (url)
       * replaces translated file with trans file 
* ocntools>report
       * html table of completion status of library
* ocntools>import (source|type)
       * queries whatever data is missing
       * creates a work version with a checklist
* ocntools>accents (bookid)
       * runs a book against the accents db and generates a report
       * includes a 'all terms' list for this book
* ocntools>validateHTML (bookid)