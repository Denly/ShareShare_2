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
    alert('Clicked submit');
    $(e.target).addClass('disabled');

    if(!Meteor.user()){
      throwError(i18n.t('You must be logged in.'));
      return false;
    }

    var title= $('#title').val();
    var url = $('#url').val();
    var shortUrl = $('#short-url').val();
    var location = $('#cur-latlng').html();//Get Location from html
    var body = instance.editor.exportFile();
    var categories=[];
    var sticky=!!$('#sticky').attr('checked');
    var secretM = !!$('#secretM_i').attr('checked');
    var submitted = $('#submitted_hidden').val();
    var userId = $('#postUser').val();
    var status = parseInt($('input[name=status]:checked').val());
//I added, If no location, cant submit!!!!
    var latlng = String(location).split(','); //cut to two pieces->array
    for (var i = 0; i < latlng.length; i++) {
        latlng[i] = parseFloat(latlng[i]);
    };

    $('input[name=category]:checked').each(function() {
      categories.push(Categories.findOne($(this).val()));
     });
    //alert('Clicked submit 2');
    var properties = {
        headline: title
      , body: body
      , shortUrl: shortUrl
      , categories: categories
      , location: [latlng]
      , sticky: sticky
      , secretM: secretM // I added
      , submitted: submitted
      , userId: userId
      , status: status
    };
    //test
    console.log("this is location: [latlng] -->" + properties.location);

    if(url){
      var cleanUrl = (url.substring(0, 7) == "http://" || url.substring(0, 8) == "https://") ? url : "http://"+url;
      properties.url = cleanUrl;
    }
alert('Before Call; after ifurl');

    Meteor.call('post', properties, function(error, postId) {//call post(properties) method in post.js
/*****
      alert('In Call Back');
      console.log('xpostx postId ='+postId);
      alert('I really in the Call Back');
      //console.log('post ='+post.postId);
      //alert('I really www in the Call Back');

      if(error){
        throwError(error.reason);
        clearSeenErrors();
        $(e.target).removeClass('disabled');
        if(error.error == 603)
          Router.go('/posts/'+error.details);
      alert('In erro ');
      //Router.go('/posts/'+'whyy');
          console.log('wow Router.go('/posts/'+error.details);');
      }else{
        trackEvent("new post", {'postId': post.postId});
        if(post.status === STATUS_PENDING)
          throwError('Thanks, your post is awaiting approval.')
        alert('No erro, go to '+post.postId);
        Router.go('/posts/'+post.postId);

       // Router.go('/posts/'+'test');
        console.log('wow Router.go('/posts/'+post.postId);');
      }
  *****/
    });
    alert('Out the Call');
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