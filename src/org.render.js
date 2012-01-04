/*orgdoc+++/
* Default Rendering

  This section provides a default HTML renderer for the parsed tree.

  It is intended to provide an example of how to attach rendering
  functions to the =Outline.Node='s and the different
  =Content.Block='s prototypes.

** Initialisations
    Working in the context of the =Org= object. We will need, as
    usual, some shortcuts to the =Utils=, and to =Org.Content= and
    =Org.Outline=.

    #+BEGIN_SRC js
/-orgdoc*/

Org.getRender = function(org, params){

  var OC = org.Content;
  var OM = org.Markup;
  var OO = org.Outline;
  var _U = org.Utils;

/*orgdoc+/
    #+END_SRC
** Utility functions
*** escapeHtml(str)                                                :function:
     + Purpose :: The =escapeHtml= function escapes the forbidden
                  characters in HTML/XML: =&=, =>=, =<=, ='= and ="=,
                  which are all translated to their corresponding
                  entity.
     + Arguments ::
       + =str= :: any value, converted into a string at the beginning
                  of the function.
     #+BEGIN_SRC js
/-orgdoc*/

  function escapeHtml(str){
    str = "" + str;
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/>/g, "&gt;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/'/g, "&apos;");
    str = str.replace(/"/g, "&quot;");
    return str;
  }

  function unBackslash(str){
    str = "" + str;
    str = str.replace(/\\\\/g, "<br/>");
    str = str.replace(/\\ /g, "&nbsp;");
    str = str.replace(/\\(.)/g, "$1");
    str = str.replace(/\s--\s/g, " &#151; ");
    return str;
  }

  function htmlize(str){
    return unBackslash(escapeHtml(str));
  }

  function typo(str){
    str = "" + str;
    str = str.replace(/\s*(,|\.|\)|\])\s*/g, "$1 ");
    str = str.replace(/\s*(\(|\[)\s*/g, " $1");
    str = str.replace(/\s*(;|!|\?|:)\s+/g, "&nbsp;$1 ");
    str = str.replace(/\s*(«)\s*/g, " $1&nbsp;");
    str = str.replace(/\s*(»)\s*/g, "&nbsp;$1 ");
    return str;
  }

/*orgdoc+/
     #+END_SRC
*** renderMarkup                                                   :function:
     + Purpose :: this function converts the wiki-style markup of
                  Org-Mode into HTML.
     + Arguments ::
       + =str= :: any value, converted into a string at the beginning
                  of the function.
     #+BEGIN_SRC js
/-orgdoc*/

  function renderMarkup(str){
    str = "" + str;
    str = escapeHtml(str);
    str = str.replace(/\/([^\s\/][^\/]*?[^\s\/]|[^\/])\//g, "<em>$1</em>");
    str = str.replace(/_([^\s_][^_]*?[^\s_]|[^_])_/g,   "<u>$1</u>");
    str = str.replace(/\=([^\s=][^=]*?[^\s=]|[^=])=/g,   "<code>$1</code>");
    str = str.replace(/~([^\s~][^~]*?[^\s~]|[^~])~/g,   "<samp>$1</samp>");
    str = str.replace(/\*([^*\s][^*]*?[^*\s]|[^*])\*/g, "<strong>$1</strong>");
    str = str.replace(/\+([^\s+][^+]*?[^\s+]|[^+])\+/g, "<s>$1</s>");
    str = str.replace(/\\\\/g, "<br/>");
    str = str.replace(/\\ /g, "&nbsp;");
    str = str.replace(/\s--\s/g, " &#151; ");
    return str;
  }

/*orgdoc+/
     #+END_SRC

*** renderChildren                                                 :function:
     + Purpose :: provides a utility function to render all the
                  children of a =Node= or a =Block=.
     + Arguments :: none
     + Usage :: must be called with =.call(obj)= to provide the value
                for =this=. =this= must have an enumerable =children=
                property.

     #+BEGIN_SRC js
/-orgdoc*/

  function renderChildren(){
    var i, out = "";
    for(i in this.children){
      if(this.children[i].render){
       out += this.children[i].render();
      }
    }
    return out;
  }



  OM.EmphInline.prototype.render = function(){
    return renderChildren.call(this);
  };
  OM.EmphRaw.prototype.render = function(){
    if(this.children.length){
      return renderChildren.call(this);
    }
    return "<span class='org-inline-raw'>" +
            typo(htmlize(this.content)) + "</span>";
  };
  OM.EmphCode.prototype.render = function(){
    return "<code class='org-inline-code'>" +
            htmlize(this.content) + "</code>";
  };
  OM.EmphVerbatim.prototype.render = function(){
    return "<samp class='org-inline-samp'>" +
            htmlize(this.content) + "</samp>";
  };
  OM.EmphItalic.prototype.render = function(){
    return "<em class='org-inline-italic'>" +
            renderChildren.call(this) + "</em>";
  };
  OM.EmphBold.prototype.render = function(){
    return "<strong class='org-inline-bold'>" +
            renderChildren.call(this) + "</strong>";
  };
  OM.EmphUnderline.prototype.render = function(){
    return "<u class='org-inline-underline'>" +
            renderChildren.call(this) + "</u>";
  };
  OM.EmphStrike.prototype.render = function(){
    return "<del class='org-inline-strike'>" +
            renderChildren.call(this) + "</del>";
  };
  OM.Link.prototype.render = function(){
    return "<a class='org-inline-link' href='" + this.url + "'>" +
            htmlize(this.desc) + "</a>";
  };
  OM.FootNoteRef.prototype.render = function(){
    var root = _U.root(this);
    console.log(root);
    console.log(this);
    console.log(root.fnByName[this.name]);
    var num = root.fnByName[this.name].num;
    return "<a name='fnref_" + this.name + "'/>" +
            "<a class='org-inline-fnref' href='#fndef_" + this.name + "'><sup>" +
            num + "</sup></a>";
  };



/*orgdoc+/
     #+END_SRC

** Rendering blocks
   This sections contains the code for the different types of
   instanciable blocks defined in

   We will attach a, until now undefined, =render= property to these
   block prototypes. None of these function take any argument, all
   the information they need being in the block object they will act
   upon through the =this= value.

   The container blocks (those whose constructor calls the
   =ContainerBlock= constructor) all use the =renderChildren=
   function.

   The content blocks (those whose constructor calls the
   =ContentBlock= constructor) should use their =this.lines=
   array.

*** Rendering =RootBlock=
     =RootBlock=s are rendered with a =div= tag, with class
     =org_content=.

     #+BEGIN_SRC js
/-orgdoc*/

  OC.RootBlock.prototype.render = function(){
    var out = "<div class='org_content'>\n";
    out += renderChildren.call(this);
    out += "</div>\n";
    return out;
  };

/*orgdoc+/
     #+END_SRC

*** Rendering =UlistBlock=
     =UlistBlock=s are rendered with a simple =ul= tag.

     #+BEGIN_SRC js
/-orgdoc*/

  OC.UlistBlock.prototype.render = function(){
    var out = "<ul>\n";
    out += renderChildren.call(this);
    out += "</ul>\n";
    return out;
  };

/*orgdoc+/
     #+END_SRC

*** Rendering =OlistBlock=
     =OlistBlock=s are rendered with a simple =ol= tag.

     If the block has a =start= property different from =1=, it is
     inserted in the =start= attribute of the tag.

    #+BEGIN_SRC js
/-orgdoc*/

  OC.OlistBlock.prototype.render = function(){
    var s = this.start;
    var out = "<ol" + (s === 1 ? ">\n" : " start='" + escapeHtml(s) + "'>\n");
    out += renderChildren.call(this);
    out += "</ol>\n";
    return out;
  };

/*orgdoc+/
    #+END_SRC

*** Rendering =DlistBlock=
     =DlistBlock=s are rendered with a =dl= tag.

     =DlistItemBlock=s will have to use =dt=/=dd= structure
     accordingly.

     #+BEGIN_SRC js
/-orgdoc*/

  OC.DlistBlock.prototype.render = function(){
    var out = "<dl>\n";
    out += renderChildren.call(this);
    out += "</dl>\n";
    return out;
  };

/*orgdoc+/
     #+END_SRC

*** Rendering =UlistItemBlock= and =OlistItemBlocks=
     =UlistItemBlock=s and =0listItemBlocks= are rendered with a
     #simple =li= tag.

     #+BEGIN_SRC js
/-orgdoc*/

  OC.UlistItemBlock.prototype.render =
  OC.OlistItemBlock.prototype.render = function(){
    var out = "<li>\n";
    out += renderChildren.call(this);
    out += "</li>\n";
    return out;
  };

/*orgdoc+/
     #+END_SRC

*** Rendering =DlistItemBlock=
     =DlistItemBlock=s are rendered with a =dt=/=dl= tag structure.

     The content of the =dt= is the =title= attribute of the block.

     The content of the =dd= is the rendering of this block's children.

    #+BEGIN_SRC js
/-orgdoc*/

  OC.DlistItemBlock.prototype.render = function(){
    var out = "<dt>" + this.titleInline.render() + "</dt>\n<dd>\n";
    out += renderChildren.call(this);
    out += "</dd>\n";
    return out;
  };

/*orgdoc+/
    #+END_SRC

*** Rendering =ParaBlock=
     =ParaBlock=s are rendered with a =p= tag.

     The content of the tag is the concatenation of this block's
     =this.lines=, passed to the =renderMarkup= function.

    #+BEGIN_SRC js
/-orgdoc*/

  OC.ParaBlock.prototype.render = function(){
    return "<p>\n" + renderChildren.call(this) + "</p>\n";
  };

/*orgdoc+/
    #+END_SRC

*** Rendering =VerseBlock=
     =VerseBlock=s are rendered with a =p= tag, with class
     =verse=.

     All spaces are converted to unbreakable spaces.

     All new lines are replaced by a =br= tag.

    #+BEGIN_SRC js
/-orgdoc*/

  OC.VerseBlock.prototype.render = function(){
    var out = "<p class='verse'>\n" + renderChildren.call(this) + "</p>\n";
    out = out.replace(/ /g, "&nbsp;");
    return out;
  };

/*orgdoc+/
    #+END_SRC

*** Rendering =QuoteBlock=
     =QuoteBlock=s are rendered with a =blockquote= tag.

     If the quote contains an author declaration (after a double dash),
     this declaration is put on a new line.

    #+BEGIN_SRC js
/-orgdoc*/

  OC.QuoteBlock.prototype.render = function(){
    var out = "<blockquote>\n" + renderChildren.call(this) + "</blockquote>\n";
    return out;
  };

/*orgdoc+/
    #+END_SRC

*** Rendering =CenterBlock=
     =CenterBlock=s are rendered with a simple =center= tag.

    #+BEGIN_SRC js
/-orgdoc*/

  OC.CenterBlock.prototype.render = function(){
    return "<center>\n" + renderChildren.call(this) + "</center>\n";
  };

/*orgdoc+/
    #+END_SRC

*** Rendering =ExampleBlock=
     =ExampleBlock=s are rendered with a simple =pre= tag.

     The content is not processed with the =renderMarkup= function, only
     with the =escapeHtml= function.

    #+BEGIN_SRC js
/-orgdoc*/

  OC.ExampleBlock.prototype.render = function(){
    var content = this.lines.join("\n") + "\n";
    var markup = escapeHtml(content);
    var out = "<pre>\n" + markup + "</pre>\n";
    return out;
  };

/*orgdoc+/
    #+END_SRC


*** Rendering =SrcBlock=
     =SrcBlock=s are rendered with a =pre.src= tag with a =code= tag within.
     The =code= tag may have a class attribute if the language of the
     block is known. In case there is, the class would take the language
     identifier.

     The content is not processed with the =renderMarkup= function, only
     with the =escapeHtml= function.

    #+BEGIN_SRC js
/-orgdoc*/

  OC.SrcBlock.prototype.render = function(){
    var content = this.lines.join("\n") + "\n";
    var markup = escapeHtml(content);
    var l = this.language;
    var out = "<pre class='src'><code" +
              ( l ? " class='" + l + "'>":">") +
              "\n" + markup + "</code></pre>\n";
    return out;
  };

/*orgdoc+/
    #+END_SRC

*** Rendering =HtmlBlock=
     =HtmlBlock=s are rendered by simply outputting the HTML content
     verbatim, with no modification whatsoever.

    #+BEGIN_SRC js
/-orgdoc*/

  OC.HtmlBlock.prototype.render = function(){
    var out = this.lines.join("\n") + "\n";
    return out;
  };

/*orgdoc+/
    #+END_SRC

*** Rendering =CommentBlock=
     =CommentBlock=s are ignored.

    #+BEGIN_SRC js
/-orgdoc*/

  OC.FndefBlock.prototype.render =
  OC.CommentBlock.prototype.render = function(){
    return "";
  };

/*orgdoc+/
    #+END_SRC

** Rendering headlines

    Here we render headlines, represented by =Outline.Node= objects.

    A =section= tag is used, with class orgnode, and a level.
    The =id= attribute is the computed id corresponding to a unique TOC
    identifier.

    The title is in a =div.title= element. Each tag is represented at the
    end of this element by a =span.tag= element.

    The content of the node (the RootBlock associated to this headline)
    is rendered.

    Then the subheadlines are rendered using the =renderChildren= function.

    #+BEGIN_SRC js
/-orgdoc*/

  OO.Node.prototype.render = function(){
    var headline = this.level === 0 ? this.meta["TITLE"] : this.heading.getTitle();
    var headInline = OM.tokenize(this, headline).render();

    var html = "<section id='%ID%' class='orgnode level-%LEVEL%'>";
    html = html.replace(/%ID%/, this.id());
    html = html.replace(/%LEVEL%/, this.level);

    var title = "<div class='title'>%HEADLINE%%TAGS%</div>";
    title = title.replace(/%HEADLINE%/, headInline);
    var tags = "";
    _U.each(this.heading.getTags(), function(tag, idx){
      if(tag.length){
        tags += " <span class='tag'>" + tag + "</span>";
      }
    });
    title = title.replace(/%TAGS%/, tags);

    html += title;

    var contentHtml = this.contentNode.render();
    html += contentHtml;

    var childrenHtml = renderChildren.call(this);
    html += childrenHtml;

    if(_U.notEmpty(this.fnNameByNum)){
      var root = this;
      html += "<section class='org-footnotes'><title>Notes</title>";
      _U.each(root.fnNameByNum, function(name, idx){
        if(!name){return;}
        var fn = root.fnByName[name];
        var inline = fn.inline;
        var num = fn.num;
        html += "<p class='org-footnote'><a name='fndef_" + name + "'/>" +
            "<a class='org-inline-fnref' href='#fnref_" + name + "'><sup>" +
            num + "</sup></a>&nbsp;:&nbsp;<span id='fndef_" + name+ "'>" +
            inline.render() + "</span></p>";
      });
      html += "</section>";
    }

    html += "</section>";
    return html;
  };


/*orgdoc+/
    #+END_SRC
** Conclusion

    This is the end of the function creating the default renderer.

    #+BEGIN_SRC js
/-orgdoc*/

};

/*orgdoc+/
    #+END_SRC
/---orgdoc*/



Org.getRenderers = function(org){
  var OC = org.Content;
  var OM = org.Markup;
  var OO = org.Outline;
  var _U = org.Utils;

  var DefaultHTMLRenderer = function(){
    return {

      renderChildren: function(n){
        var i, out = "";
        for(i in n.children){
          out += this.render(n.children[i]);
        }
        return out;
      },

      render: function(n){
        var type = n.nodeType;
        var renderFn = this[type];
        if(!renderFn){
          _U.log("Not found render fn:");
          _U.log(n);
          renderFn = _U.noop;
        }
        return renderFn(n, this);
      },

      escapeHtml: function(str){
        str = "" + str;
        str = str.replace(/&/g, "&amp;");
        str = str.replace(/>/g, "&gt;");
        str = str.replace(/</g, "&lt;");
        str = str.replace(/'/g, "&apos;");
        str = str.replace(/"/g, "&quot;");
        return str;
      },

      unBackslash: function(str){
        str = "" + str;
        str = str.replace(/\\\\/g, "<br/>");
        str = str.replace(/\\ /g, "&nbsp;");
        str = str.replace(/\\(.)/g, "$1");
        str = str.replace(/\s--\s/g, " &#151; ");
        return str;
      },

      htmlize: function(str, r){
        return r.unBackslash(r.escapeHtml(str));
      },

      typo: function(str){
        str = "" + str;
        str = str.replace(/\s*(,|\.|\)|\])\s*/g, "$1 ");
        str = str.replace(/\s*(\(|\[)\s*/g, " $1");
        str = str.replace(/\s*(;|!|\?|:)\s+/g, "&nbsp;$1 ");
        str = str.replace(/\s*(«)\s*/g, " $1&nbsp;");
        str = str.replace(/\s*(»)\s*/g, "&nbsp;$1 ");
        return str;
      },

      EmphInline: function(n, r){
        return r.renderChildren(n);
      },

      EmphRaw: function(n, r){
        if(n.children.length){
          return r.renderChildren(n);
        }
        return "<span class='org-inline-raw'>" +
                r.typo(r.htmlize(n.content, r)) + "</span>";
      },

      EmphCode: function(n, r){
        return "<code class='org-inline-code'>" +
                r.htmlize(n.content, r) + "</code>";
      },
      
      EmphVerbatim: function(n, r){
        return "<samp class='org-inline-samp'>" +
                r.htmlize(n.content, r) + "</samp>";
      },

      EmphItalic: function(n, r){
        return "<em class='org-inline-italic'>" +
                r.renderChildren(n) + "</em>";
      },

      EmphBold: function(n, r){
        return "<strong class='org-inline-bold'>" +
                r.renderChildren(n) + "</strong>";
      },

      EmphUnderline: function(n, r){
        return "<u class='org-inline-underline'>" +
                r.renderChildren(n) + "</u>";
      },

      EmphStrike: function(n, r){
        return "<del class='org-inline-strike'>" +
                r.renderChildren(n) + "</del>";
      },

      Link: function(n, r){
        return "<a class='org-inline-link' href='" + n.url + "'>" +
                r.htmlize(n.desc, r) + "</a>";
      },

      FootNoteRef: function(n, r){
        var root = _U.root(n);
        var num = root.fnByName[n.name].num;
        return "<a name='fnref_" + n.name + "'/>" +
                "<a class='org-inline-fnref' href='#fndef_" + n.name + "'><sup>" +
                num + "</sup></a>";
      },

      RootBlock: function(n, r){
        var out = "<div class='org_content'>\n";
        out += r.renderChildren(n);
        out += "</div>\n";
        return out;
      },

      UlistBlock: function(n, r){
        var out = "<ul>\n";
        out += r.renderChildren(n);
        out += "</ul>\n";
        return out;
      },

      OlistBlock: function(n, r){
        var s = n.start;
        var out = "<ol" + (s === 1 ? ">\n" : " start='" + r.escapeHtml(s) + "'>\n");
        out += r.renderChildren(n);
        out += "</ol>\n";
        return out;
      },

      DlistBlock: function(n, r){
        var out = "<dl>\n";
        out += r.renderChildren(n);
        out += "</dl>\n";
        return out;
      },

      UlistItemBlock: function(n, r){
        var out = "<li>\n";
        out += r.renderChildren(n);
        out += "</li>\n";
        return out;
      },

      OlistItemBlock: function(n, r){
        var out = "<li>\n";
        out += r.renderChildren(n);
        out += "</li>\n";
        return out;
      },

      DlistItemBlock: function(n, r){
        var out = "<dt>" + r.render(n.titleInline) + "</dt>\n<dd>\n";
        out += r.renderChildren(n);
        out += "</dd>\n";
        return out;
      },

      ParaBlock: function(n, r){
        return "<p>\n" + r.renderChildren(n) + "</p>\n";
      },

      VerseBlock: function(n, r){
        var out = "<p class='verse'>\n" + r.renderChildren(n) + "</p>\n";
        out = out.replace(/ /g, "&nbsp;");
        return out;
      },

      QuoteBlock: function(n, r){
        var out = "<blockquote>\n" + r.renderChildren(n) + "</blockquote>\n";
        return out;
      },

      CenterBlock: function(n, r){
        return "<center>\n" + r.renderChildren(n) + "</center>\n";
      },

      ExampleBlock: function(n, r){
        var content = n.lines.join("\n") + "\n";
        var markup = r.escapeHtml(content);
        var out = "<pre>\n" + markup + "</pre>\n";
        return out;
      },

      SrcBlock: function(n, r){
        var content = n.lines.join("\n") + "\n";
        var markup = r.escapeHtml(content);
        var l = n.language;
        var out = "<pre class='src'><code" +
                  ( l ? " class='" + l + "'>":">") +
                  "\n" + markup + "</code></pre>\n";
        return out;
      },

      HtmlBlock: function(n, r){
        var out = n.lines.join("\n") + "\n";
        return out;
      },

      FndefBlock: function(n, r){
        return "";
      },

      CommentBlock : function(n, r){
        return "";
      },

      Node: function(n, r){
        var headline = n.level === 0 ? n.meta["TITLE"] : n.heading.getTitle();
        var headInline = r.render(OM.tokenize(n, headline));

        var html = "<section id='%ID%' class='orgnode level-%LEVEL%'>";
        html = html.replace(/%ID%/, n.id());
        html = html.replace(/%LEVEL%/, n.level);

        var title = "<div class='title'>%HEADLINE%%TAGS%</div>";
        title = title.replace(/%HEADLINE%/, headInline);
        var tags = "";
        _U.each(n.heading.getTags(), function(tag, idx){
          if(tag.length){
            tags += " <span class='tag'>" + tag + "</span>";
          }
        });
        title = title.replace(/%TAGS%/, tags);

        html += title;

        var contentHtml = r.render(n.contentNode);
        html += contentHtml;

        var childrenHtml = r.renderChildren(n);
        html += childrenHtml;

        if(_U.notEmpty(n.fnNameByNum)){
          var root = n;
          html += "<section class='org-footnotes'><title>Notes</title>";
          _U.each(root.fnNameByNum, function(name, idx){
            if(!name){return;}
            var fn = root.fnByName[name];
            var inline = fn.inline;
            var num = fn.num;
            html += "<p class='org-footnote'><a name='fndef_" + name + "'/>" +
                "<a class='org-inline-fnref' href='#fnref_" + name + "'><sup>" +
                num + "</sup></a>&nbsp;:&nbsp;<span id='fndef_" + name+ "'>" +
                r.render(inline) + "</span></p>";
          });
          html += "</section>";
        }

        html += "</section>";
        return html;
      }
    };
  };


  return {
    html: DefaultHTMLRenderer
  };
};