var Parser = {
  stack: [],
  position: 0,
  wf: true,
  current: '',
  posMark: '\u25AE',
  tokenize: function(str) {
    return str.split('<');
  },
  /**
   *  The parse function does not do a true XML well-formedness check.
   *  In fact, it only does an extremely dumb, though fast, check that
   *  tags are properly nested. Takes a string containing the XML doc.
   */
  parse: function(doc) {
      this.stack = [];
      this.position = 0;
      this.wf = true;
      var stream = this.tokenize(doc);
      for (var i = 0; i < stream.length; i++) {
          var token = stream[i];
          this.position += 4;
          var len = token.length;
          if (token.indexOf('>') > 0) {
              //get tag internals
              token = token.substring(0, token.indexOf('>')).trim();
              //ignore PIs and comments
              if (token.charAt(0) == '?' || token.charAt(0) == '!') {
                  continue;
              }
              //if it's a close tag, pop the element off the stack
              if (token.charAt(0) == '/') {
                  token = token.substring(1).trim();
                  if (this.stack[this.stack.length - 1] == token) {
                      this.stack.pop();
                      this.current = this.stack[this.stack.length - 1];
                  } else {
                      this.wf = false;
                      break;
                  }
                  continue;
              }
              //if it's a self-closing tag, ignore it
              if (token.charAt(token.length - 1) == '/') {
                  continue;
              }
              //if it's an open tag, put the name on the stack
              if (token.indexOf(' ') > 0) {
                  this.stack.push(token.substring(0, token.indexOf(' ')));
              } else {
                  this.stack.push(token);
              }
              this.current = this.stack[this.stack.length - 1];
          } else {
              if (token.length > 0) {
                  token = token.trim();
                  if (token.indexOf(' ') >= 0) {
                      token = token.substring(0, token.indexOf(' '));
                      this.current = token;
                  } else if (token.length > 0) {
                      this.current = token;
                  }
              }
          }
          this.position += len;
      }
      if (this.stack.length == 0 && this.wf == true) {
          this.wf = true;
      } 
      return this.wf;
  },
  // Parse up to the point in the doc string given by the location
  parseToLocation: function(doc, location) {
      var state = this.parse(doc.substring(0, location));
      return this.current;
  },
  // Parse the contents of an element, given by the id parameter
  parseElementContents: function(id) {
      return this.parse(jQuery(id).text());
  },
  /* 
   *  Parse the contents of an element, given by the id parameter up to the first
   *  occurrence of the character given by the posMark member variable.
   */
  parseElementContentsToLocation: function(id) {
      var doc = jQuery(id).text();
      return this.parseToLocation(doc, doc.indexOf(this.posMark));
  }
};