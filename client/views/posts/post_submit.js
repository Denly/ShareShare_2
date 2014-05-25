Template.post_submit.helpers({
  categoriesEnabled: function(){
    return Categories.find().count();
  },
  categories: function(){
    return Categories.find();
  },
  users: function(){
    return Meteor.users.find();
  },
  userName: function(){
    return getDisplayName(this);
  },
  isSelected: function(){
    var post=Posts.findOne(Session.get('selectedPostId'));
    return (post && this._id == post.userId) ? 'selected' : '';
  }
});

Template.post_submit.rendered = function(){
  Session.set('selectedPostId', null);
  if(!this.editor && $('#editor').exists())
    this.editor= new EpicEditor(EpicEditorOptions).load();
  $('#submitted').datepicker().on('changeDate', function(ev){
    $('#submitted_hidden').val(moment(ev.date).valueOf());
  });

  $('#loc-btn').css({
    'float': 'left',
  });

  // $("#postUser").selectToAutocomplete(); // XXX

}

Template.post_submit.events({
  'click input[type=submit]': function(e, instance){
    e.preventDefault();

    $(e.target).addClass('disabled');

    if(!Meteor.user()){
      throwError(i18n.t('You must be logged in.'));
      return false;
    }

    var title= $('#title').val();
    var url = $('#url').val();
    var shortUrl = $('#short-url').val();
    var location = $('#cur-latlng').html();
    var body = instance.editor.exportFile();
    var categories=[];
    var sticky=!!$('#sticky').attr('checked');
    var submitted = $('#submitted_hidden').val();
    var userId = $('#postUser').val();
    var status = parseInt($('input[name=status]:checked').val());

    var latlng = location.split(',');
    for (var i = 0; i < latlng.length; i++) {
        latlng[i] = parseFloat(latlng[i]);
    };

    $('input[name=category]:checked').each(function() {
      categories.push(Categories.findOne($(this).val()));
     });

    var properties = {
        headline: title
      , body: body
      , shortUrl: shortUrl
      , categories: categories
      , location: [latlng]
      , sticky: sticky
      , submitted: submitted
      , userId: userId
      , status: status
    };
    if(url){
      var cleanUrl = (url.substring(0, 7) == "http://" || url.substring(0, 8) == "https://") ? url : "http://"+url;
      properties.url = cleanUrl;
    }

    Meteor.call('post', properties, function(error, post) {
      if(error){
        throwError(error.reason);
        clearSeenErrors();
        $(e.target).removeClass('disabled');
        if(error.error == 603)
          Router.go('/posts/'+error.details);
      }else{
        trackEvent("new post", {'postId': post.postId});
        if(post.status === STATUS_PENDING)
          throwError('Thanks, your post is awaiting approval.')
        Router.go('/posts/'+post.postId);
      }
    });
  },
  'click .get-title-link': function(e){
    e.preventDefault();
    var url=$("#url").val();
    $(".get-title-link").addClass("loading");
    if(url){
      $.get(url, function(response){
          if ((suggestedTitle=((/<title>(.*?)<\/title>/m).exec(response.responseText))) != null){
              $("#title").val(suggestedTitle[1]);
          }else{
              alert("Sorry, couldn't find a title...");
          }
          $(".get-title-link").removeClass("loading");
       });
    }else{
      alert("Please fill in an URL first!");
      $(".get-title-link").removeClass("loading");
    }
  },
  'click #loc-btn': function(e) {
    e.preventDefault();
    //console.log(e);
    //var loadingImg = $(e.target).after('<img src="img/loading.gif" style="margin: 4px 8px">');
    var loadingImg = $('<img src="img/loading.gif" style="margin: 1px 8px">').insertAfter(e.target);
    var location = navigator.geolocation.getCurrentPosition(GetLocation);
    function GetLocation(location) {
        //console.log(location.coords);
        var lat = location.coords.latitude.toFixed(3);
        var lng = location.coords.longitude.toFixed(3);
        //console.log(loadingImg.attr('src'));
        loadingImg.attr('src', 'img/ok.png')
            .after($('<span id="cur-latlng">' + lat + ', ' + lng + '</span>'));    }
  }
});