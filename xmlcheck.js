/**
 *  XMLCheck is a tool for quickly doing minimal parsing/well-formedness checking
 *  on an XML document (it really just checks for proper tag nesting).  Parsing 
 *  can run just to the current cursor position and then stop. When a parse
 *  has been run, the object can report on the list of open elements, the current
 *  element name, the position in the document that it parsed to, document well-
 *  formedness (if it parsed to the end), and whether the position parsed to is
 *  inside a tag.
 */
var XMLCheck = {
  stack: [],
  position: 0,
  insideTag: false,
  wf: true,
  current: '',
  posMark: '\u202F',
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
      this.insideTag = false;
      var stream = this.tokenize(doc);
      if (stream[0].length > 0) {
          this.wf = false;
      }
      for (var i = 1; i < stream.length; i++) {
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
              this.insideTag = true;
              token = token.trim();
              if (token.length > 0) {
                  if (token.charAt(0) == '?' || token.charAt(0) == '!' || token.charAt(0) == '/') {
                      this.current = this.stack[this.stack.length - 1];
                  } else {
                      if (token.indexOf(' ') >= 0) {
                        token = token.substring(0, token.indexOf(' '));
                        this.current = token;
                      } else if (token.length > 0) {
                        this.current = token;
                      }
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
  parseElementContentsToCursor: function(id) {
      var sel = rangy.getSelection(); 
      if (sel.rangeCount) {
          var node = document.createTextNode(this.posMark);
          var range = sel.getRangeAt(0);
          range.insertNode(node);
          var doc = jQuery(id).text();
          this.parseToLocation(doc, doc.indexOf(this.posMark));
          range.selectNode(node);
          range.deleteContents();
      }
  },
  getCurrentElement: function() {
      return this.current;
  }
};