// Load the document and parse it
$(function(){
  /*////
  $.get("test/document.org", function(data){
    var root = Org.Outline.parse(data);
    $('#sample').html(root.render());
    Org.Utils.log(root);
  });
  //*///

  $.get("doc/org-js.org", function(data){
    var org = new Org();
    var root = org.Outline.parse(data);
    org.Utils.log(root);
    $('#doc').html(root.render());

    var renderer = org.Renderers.html();
    $('#doc2').html(renderer.render(root));

  });

});
