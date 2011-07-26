/*orgdoc+++/
* Markup parser

  This file contains the code for the Org-Mode wiki-style markup.

    #+BEGIN_SRC js
/-orgdoc*/
Org.Markup = (function(Org){

  var _U = Org.Utils;
  var _C = Org.Config;

  var Markup = {};

///////////////////////////////////////////////////////////////////////////////
// LINKS

  var LinkDefs = (function(){
    var l = 0;
    return {
      HTTP:     {id:++l, re:/^https?:/},
      FTP:      {id:++l, re:/^ftp:/},
      FILE:     {id:++l, re:/^(?:file:|\.{1,2}\/)/},
      MAIL:     {id:++l, re:/^mailto:/},
      ID:       {id:++l, re:/^#/},
      PROTOCOL: {id:++l, re:/:/},
      SEARCH:   {id:++l, re:/.*/}
    };
  }());

  var LinkType={};  _U.map(LinkDefs, function(v,k){LinkType[k] = v.id;});
  var LinkTypeArr = _U.map(LinkType, function(v,k){LinkType[k];});

  function getLinkType(link){
    for(k in LinkTypeArr){
      if(link.url.match(LinkTypeArr[k].re)){return LinkType[k];}
    }
  }

  var Link = function(parent, raw, url, desc, token){
    this.raw = raw;
    this.parent = parent;
    this.url = url;
    this.desc = desc;
    this.token = token;
    this.type = getLinkType(this);
  };


///////////////////////////////////////////////////////////////////////////////
// TYPO
  
//   + Allowed pre:      " \t('\"{"
//   + Allowed post:     "- \t.,:!?;'\")}\\"
//   + Forbidden border: " \t\r\n,\"'"
//   + Allowed body:     "."
// (defcustom org-emphasis-regexp-components
//   '(" \t('\"{" "- \t.,:!?;'\")}\\" " \t\r\n,\"'" "." 1)
//   "Components used to build the regular expression for emphasis.
// This is a list with five entries.  Terminology:  In an emphasis string
// like \" *strong word* \", we call the initial space PREMATCH, the final
// space POSTMATCH, the stars MARKERS, \"s\" and \"d\" are BORDER characters
// and \"trong wor\" is the body.  The different components in this variable
// specify what is allowed/forbidden in each part:
// pre          Chars allowed as prematch.  Beginning of line will be allowed too.
// post         Chars allowed as postmatch.  End of line will be allowed too.
// border       The chars *forbidden* as border characters.
// body-regexp  A regexp like \".\" to match a body character.  Don't use
//              non-shy groups here, and don't allow newline here.
// newline      The maximum number of newlines allowed in an emphasis exp.
// Use customize to modify this, or restart Emacs after changing it."
//   :group 'org-appearance
//   :set 'org-set-emph-re
//   :type '(list
//     (sexp    :tag "Allowed chars in pre      ")
//     (sexp    :tag "Allowed chars in post     ")
//     (sexp    :tag "Forbidden chars in border ")
//     (sexp    :tag "Regexp for body           ")
//     (integer :tag "number of newlines allowed")
//     (option (boolean :tag "Please ignore this button"))))

  var EmphMarkers = {};
  _U.each("/*~=+_".split(""), function(t){EmphMarkers[t] = {};});

  EmphMarkers.getInline = function(token, parent){
    var constr = this[token].constr;
    return new constr(parent);
  };
  EmphMarkers.getRegexpAll = function(){
    // TODO : refactor to : 
    //    - take the real pre/post/border char sets in config
    return /(^(?:.|\n)*?)(([\/*~=+_])([^\s].*?[^\s\\]|[^\s\\])\3)/;        //*/
  };
  Markup.EmphMarkers = EmphMarkers;

  var EmphInline = function(parent){
    this.parent = parent;
    this.children = [];
  };
  EmphInline.prototype.consume = function(content){
    var regexp = EmphMarkers.getRegexpAll();
    var match;
    var rest = content;
    var pre, hasEmph, type, inner, length;
    var raw, sub;
    while((_U.trim(rest).length > 0) && (match = regexp.exec(rest))){
      pre = match[1];
      hasEmph = match[2];
      token = match[3] || "";
      inner = match[4] || "";
      length = pre.length + inner.length + (hasEmph ? 2 : 0);
      if(length === 0){break;}
      rest = rest.substr(length);
      if(_U.trim(pre).length > 0){
        raw = new EmphRaw(this);
        this.children.push(raw);
        raw.consume(pre);
      }
      if(hasEmph !== void(0)){
        sub = EmphMarkers.getInline(token, this);
        this.children.push(sub);
        sub.consume(inner);
      }
    }
    if(_U.trim(rest).length > 0){
      raw = new EmphRaw(this);
      this.children.push(raw);
      raw.consume(rest);
    }
  };
  Markup.EmphInline = EmphInline;

  var EmphRaw = function(parent){
    EmphInline.call(this, parent);
    this.recurse = false;
  };
  EmphRaw.prototype = Object.create(EmphInline.prototype);
  EmphRaw.prototype.consume = function(content){
    this.content = content;
  };
  Markup.EmphRaw = EmphRaw;


  var EmphItalic = function(parent){
    EmphInline.call(this, parent);
    this.recurse = true;
  };
  EmphItalic.prototype = Object.create(EmphInline.prototype);
  EmphMarkers["/"].constr = EmphItalic;
  Markup.EmphItalic = EmphItalic;


  var EmphBold = function(parent){
    EmphInline.call(this, parent);
    this.recurse = true;
  };
  EmphBold.prototype = Object.create(EmphInline.prototype);
  EmphMarkers["*"].constr = EmphBold;
  Markup.EmphBold = EmphBold;


  var EmphUnderline = function(parent){
    EmphInline.call(this, parent);
    this.recurse = true;
  };
  EmphUnderline.prototype = Object.create(EmphInline.prototype);
  EmphMarkers["_"].constr = EmphUnderline;
  Markup.EmphUnderline = EmphUnderline;


  var EmphStrike = function(parent){
    EmphInline.call(this, parent);
    this.recurse = true;
  };
  EmphStrike.prototype = Object.create(EmphInline.prototype);
  EmphMarkers["+"].constr = EmphStrike;
  Markup.EmphStrike = EmphStrike;


  var EmphCode = function(parent){
    EmphRaw.call(this, parent);
  };
  EmphCode.prototype = Object.create(EmphRaw.prototype);
  EmphMarkers["="].constr = EmphCode;
  Markup.EmphCode = EmphCode;


  var EmphVerbatim = function(parent){
    EmphRaw.call(this, parent);
  };
  EmphVerbatim.prototype = Object.create(EmphRaw.prototype);
  EmphMarkers["~"].constr = EmphVerbatim;
  Markup.EmphVerbatim = EmphVerbatim;


///////////////////////////////////////////////////////////////////////////////
// PARSE

  var _linkTokenId = 0;

  Markup.tokenize = function tokenize(parent, str){
    str = "" + (str || "");
    var initStr = str;

    var links = {};
    var linkTokenPrefix = uniqToken("LINK");  

    function uniqToken(p){return _U.getAbsentToken(initStr, p);}

///////////////////////////////////////////////////////////////////////////////
//     LINKS
    function linkToken(){return linkTokenPrefix + (++_linkTokenId);}

    function linkReplacer(urlIdx, descIdx){
      return function(){
        var t = linkToken();
        var a = arguments;
        links[t] = new Link(parent, a[0], a[urlIdx], a[descIdx], t);
        return t;
      };
    }

    // Whole links with URL and description : [[url:...][Desc of the link]]
    var descLinkRegex = /\[\[((?:.|\s)*?)\]\[((?:.|\s)*?)\]\]/gm;
    str = str.replace(descLinkRegex, linkReplacer(1, 2));
    
    // Single links with URL only : [[url:...]]
    var singleLinkRegex = /\[\[((?:.|\s)*?)\]\]/gm;
    str = str.replace(descLinkRegex, linkReplacer(1, 1));
    
    // Treating bare URLs, or URLs without a description attached.
    var urlRegex = new RegExp("(?:" + _C.urlProtocols.join("|") + '):[^\\s]+', "gi");
    str = str.replace(urlRegex, linkReplacer(0, 0));

///////////////////////////////////////////////////////////////////////////////
//     FOOTNOTES

// TODO

    var iObj = new EmphInline(parent);
    iObj.consume(str);
    return iObj;
  };


  return Markup;

}(Org));
/*orgdoc+/
    #+END_SRC
/---orgdoc*/