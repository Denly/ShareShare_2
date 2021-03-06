/*Template.post_item.events({
  'click .getbtn': function(){
    $('body').css('color','red');
    $('.ownerimg').attr('src','https://avatars3.githubusercontent.com/u/7588279?s=140');

    Posts.update({_id: Posts.findOne()._id }, {$set: {owner: Posts.findOne().author }} );

    //ex. {_id: player._id}, {$set: {score: random_score}}
    // var tmp = Posts.findOne().waittingList;
    // console.log(tmp.indexOf('pee'));

    // tmp.push('pee');
    // console.log(tmp);
    // Posts.update({_id: Posts.findOne()._id }, {$set: {waittingList: tmp }});

    //Meteor.call(newPostNotify,Posts.findOne());

    var fakeLatLng = [
        [25.053875, 121.468701],
        [25.091191, 121.511102],
        [25.067947, 121.553631],
        [25.062272, 121.581483],
        [25.042289, 121.576161],
        [25.019609, 121.541612],
    ];
    Meteor.call('updateLocation', fakeLatLng, this.data._id, function(error) {
        Meteor.call('getLocation', this.data._id, function(error, loc) {
            if(error) {
                throwError(error.reason);
                console.log('cannot get location');
            } else {
                //latlngs = loc;
                animateMap(loc);
            }
        });
    });

    function animateMap(latlngs) {
        console.log(latlngs);
        var pathPattern = L.polylineDecorator(latlngs, {
          patterns: [
            { offset: 0, repeat: 10, symbol: L.Symbol.dash({pixelSize: 6, pathOptions: {color: '#ff0000', weight: 3, opacity: 0.5}}) },
          ]
        }).addTo(map);

        //var arrow = L.polyline([[ 42.9, -15 ], [ 44.18, -11.4 ]], {});
        var arrowHead = L.polylineDecorator(latlngs).addTo(map);
        var arrowOffset = 0;
        var bikeIcon = L.icon({
            iconUrl: 'http://i.imgur.com/iau54EZ.png',
            iconAnchor: [16, 16]
        });
        var anim = window.setInterval(function() {
            arrowHead.setPatterns([
                //{offset: arrowOffset+'%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 15, polygon: false, pathOptions: {stroke: true}})}
                {
                    offset: arrowOffset+'%',
                    repeat: 0,
                    symbol: L.Symbol.marker({
                        // rotate: true,
                        markerOptions: {
                            icon: bikeIcon,
                        }
                    })
                }
            ]);
            arrowOffset += 1;
            if(arrowOffset > 100)
                arrowOffset = 0;
        }, 50);

        /*var markerLine = L.polyline([[58.44773, -28.65234], [52.9354, -23.33496], [53.01478, -14.32617], [58.1707, -10.37109], [59.68993, -0.65918]], {}).addTo(map);
        var markerPatterns = L.polylineDecorator(markerLine, {
            patterns: [
                { offset: '5%', repeat: '10%', symbol: L.Symbol.marker({
                    markerOptions: {
                        icon: 'http://www.wheatonbible.org/Content/10713/Icons/map-marker.png'
                    }
                }) }
            ]
        }).addTo(map);

    }
  }
});*/
var map, arrowHead, pathPattern;
/*
Template.post_item.created = function () {
  instance = this;
  var fakeLatLng = [
    [25.053875, 121.468701],
    [25.091191, 121.511102],
    [25.067947, 121.553631],
    [25.062272, 121.581483],
    [25.042289, 121.576161],
  ];
  Meteor.call('updateLocation', fakeLatLng, this.data._id);
};*/

Template.post_item.helpers({
  post: function(){
    // note: when the data context is set by the router, it will be "this.post". When set by a parent template it'll be "this"
    //????
    return this.post || this;
  },
  //ownername:function(){
   // console.log(Posts.ownerUser.username);
    //return Posts.ownerUser.username;
  //},
  postLink: function(){
    return !!this.url ? getOutgoingUrl(this.url) : "/posts/"+this._id;
  },
  postTarget: function() {
    return !!this.url ? '_blank' : '';
  },
  oneBasedRank: function(){
    if(typeof this.rank != 'undefined')
      return this.rank + 1;
  },
  domain: function(){
    var a = document.createElement('a');
    a.href = this.url;
    return a.hostname;
  },
  current_domain: function(){
    return "http://"+document.domain;
  },
  can_edit: function(){
    return canEdit(Meteor.user(), this);
  },
  authorName: function(){
    return getAuthorName(this);
  },
  profileUrl: function(){
    // note: we don't want the post to be re-rendered every time user properties change
    var user = Meteor.users.findOne(this.userId, {reactive: false});
    if(user)
      return getProfileUrl(user);
  },
  short_score: function(){
    return Math.floor(this.score*1000)/1000;
  },
  body_formatted: function(){
    var converter = new Markdown.Converter();
    var html_body=converter.makeHtml(this.body);
    return html_body.autoLink();
  },
  ago: function(){
    // if post is approved show submission time, else show creation time.
    time = this.status == STATUS_APPROVED ? this.submitted : this.createdAt;
    return moment(time).fromNow();
  },
  timestamp: function(){
    time = this.status == STATUS_APPROVED ? this.submitted : this.createdAt;
    return moment(time).format("MMMM Do, h:mm:ss a");
  },
  voted: function(){
    var user = Meteor.user();
    if(!user) return false;
    return _.include(this.upvoters, user._id);
  },
  userAvatar: function(){
    var author = Meteor.users.findOne(this.userId, {reactive: false});
    if(!!author)
      return getAvatarUrl(author);
  },
  inactiveClass: function(){
    return (isAdmin(Meteor.user()) && this.inactive) ? i18n.t('inactive') : "";
  },
  categoryLink: function(){
    return getCategoryUrl(this.slug);
  },
  commentsDisplayText: function(){
    return this.comments == 1 ? i18n.t('comment') : i18n.t('comments');
  },
  pointsUnitDisplayText: function(){
    return this.votes == 1 ? i18n.t('point') : i18n.t('points');
  }
});

var recalculatePosition = function ($object, pArray) {
  // delta is the difference between the last two positions in the array
  var delta = pArray[pArray.length-2] - pArray[pArray.length-1];

  // if new position is different from previous position
  if(delta != 0){
    // send object back to previous position
    $object.removeClass('animate').css("top", delta + "px");
    // then wait a little and animate it to new one
    setTimeout(function() {
      $object.addClass('animate').css("top", "0px")
    }, 1);
  }
}

Template.post_item.rendered = function(){
  // var instance = this,
  //     $instance = $(instance.firstNode.nextSibling),
  //     top = $instance.position().top;

  // // if this is the first render, initialize array, else push current position
  // if(typeof instance.pArray === 'undefined'){
  //   instance.pArray = [top]
  // }else{
  //   instance.pArray.push(top);
  // }

  // // if this is *not* the first render, recalculate positions
  // if(instance.pArray.length>1)
  //   recalculatePosition($instance, instance.pArray);
  var $map = $('#map').css({
    width: '100%',
    height: '300px',
    //display: 'none'
  });
  /*
  var a=[];
  a[0]=Posts.findOne().location[1];
  var b=[25,122];
  var c=this.location;
  console.log(' a= '+a+' b= '+b+' c= '+c);*/
  map = new L.map('map');//Library??
  map.setView(String(Posts.findOne().location).split(','), 12);// set map
  L.Icon.Default.imagePath = 'packages/leaflet/images';
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
    }).addTo(map);
  //L.tileLayer.provider('Stamen.Watercolor').addTo(map);
  $('#location-trigger').on('click', function() {
    $map.slideToggle();
  });

  // , function(error, result) {
  //   if(error) {
  //       throwError(error.reason);
  //       console.log('cannot get location');
  //   } else {
  //       //latlngs = loc;
  //       animateMap(loc);
  //   }
  // });

  //var latlngs = [];
  console.log(this.data._id);
  /*
  Meteor.call('getLocation', this.data._id, function(error, loc) {
    if(error) {
        throwError(error.reason);
        console.log('cannot get location');
    } else {
        //latlngs = loc;
        animateMap(loc);
    }
  });*/
/*
  function animateMap(latlngs) {
    console.log(latlngs);
    pathPattern = L.polylineDecorator(latlngs, {
      patterns: [
        { offset: 0, repeat: 10, symbol: L.Symbol.dash({pixelSize: 6, pathOptions: {color: '#ff0000', weight: 3, opacity: 0.5}}) },
      ]
    }).addTo(map);

    //var arrow = L.polyline([[ 42.9, -15 ], [ 44.18, -11.4 ]], {});
    arrowHead = L.polylineDecorator(latlngs).addTo(map);

    var arrowOffset = 0;
    var bikeIcon = L.icon({
        iconUrl: 'http://i.imgur.com/iau54EZ.png',
        iconAnchor: [16, 16]
    });
    var anim = window.setInterval(function() {
        arrowHead.setPatterns([
            //{offset: arrowOffset+'%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 15, polygon: false, pathOptions: {stroke: true}})}
            {
                offset: arrowOffset+'%',
                repeat: 0,
                symbol: L.Symbol.marker({
                    // rotate: true,
                    markerOptions: {
                        icon: bikeIcon,
                    }
                })
            }
        ]);
        arrowOffset += 1;
        if(arrowOffset > 100)
            arrowOffset = 0;
    }, 50);

    /*var markerLine = L.polyline([[58.44773, -28.65234], [52.9354, -23.33496], [53.01478, -14.32617], [58.1707, -10.37109], [59.68993, -0.65918]], {}).addTo(map);
    var markerPatterns = L.polylineDecorator(markerLine, {
        patterns: [
            { offset: '5%', repeat: '10%', symbol: L.Symbol.marker({
                markerOptions: {
                    icon: 'http://www.wheatonbible.org/Content/10713/Icons/map-marker.png'
                }
            }) }
        ]
    }).addTo(map);

  }
*/
/*
  var myIcon = L.icon({
    iconUrl: 'http://i.imgur.com/iau54EZ.png'
  });

  var line = L.polyline([[23.68510, 120.94136],[23.5, 120]]);
  console.log(line.getLatLngs());
  var animatedMarker = L.animatedMarker(line.getLatLngs(), {
        icon: myIcon,
        // distance: 300,  // meters
        // interval: 2000, // milliseconds
        autoStart: false,
      });

  map.addLayer(animatedMarker);
  console.log(animatedMarker);
*/
  /*var polyline = L.polyline([[23.5, 120], [23, 120]], {color: 'red'}).addTo(map);*/

    // zoom the map to the polyline
    // map.fitBounds(polyline.getBounds());
};

Template.post_item.events({
  'click .upvote-link': function(e, instance){
    var post = this;
    e.preventDefault();
    if(!Meteor.user()){
      Router.go('/signin');
      throwError(i18n.t("Please log in first"));
    }
    Meteor.call('upvotePost', post, function(error, result){
      trackEvent("post upvoted", {'_id': post._id});
    });
  },
  'click .share-link': function(e){
    var $this = $(e.target).parents('.post-share').find('.share-link');
    var $share = $this.parents('.post-share').find('.share-options');
    e.preventDefault();
    $('.share-link').not($this).removeClass("active");
    $(".share-options").not($share).addClass("hidden");
    $this.toggleClass("active");
    $share.toggleClass("hidden");
    $share.find('.share-replace').sharrre(SharrreOptions);
  },

 /* 'click .getbtn': function(){
    $('body').css('color','red');
    //$('.ownerimg').attr('src','https://avatars3.githubusercontent.com/u/7588279?s=140');

    //Posts.update({_id: Posts.findOne()._id }, {$set: {owner: Posts.findOne().author }} );

    //ex. {_id: player._id}, {$set: {score: random_score}}
    // var tmp = Posts.findOne().waittingList;
    // console.log(tmp.indexOf('pee'));

    // tmp.push('pee');
    // console.log(tmp);
    // Posts.update({_id: Posts.findOne()._id }, {$set: {waittingList: tmp }});

    //Meteor.call(newPostNotify,Posts.findOne());

    var fakeLatLng = [
        [25.053875, 121.468701],
        [25.091191, 121.511102],
        [25.067947, 121.553631],
        [25.062272, 121.581483],
        [25.042289, 121.576161],
        [25.019609, 121.541612],
    ];
    Meteor.call('updateLocation', fakeLatLng, instance.data._id, function(error) {
        console.log(Meteor);
        Meteor.call('getLocation', instance.data._id, function(error, loc) {
            if(error) {
                throwError(error.reason);
                console.log('cannot get location');
            } else {
                //latlngs = loc;
                console.log(loc);
                animateMap(loc);
            }
        });
    });

    function animateMap(latlngs) {
        console.log(latlngs);
        pathPattern.removeFrom(map);
        arrowHead.removeFrom(map);

        pathPattern = L.polylineDecorator(latlngs, {
          patterns: [
            { offset: 0, repeat: 10, symbol: L.Symbol.dash({pixelSize: 6, pathOptions: {color: '#ff0000', weight: 3, opacity: 0.5}}) },
          ]
        }).addTo(map);

        //var arrow = L.polyline([[ 42.9, -15 ], [ 44.18, -11.4 ]], {});
        arrowHead = L.polylineDecorator(latlngs).addTo(map);
        var arrowOffset = 0;
        var bikeIcon = L.icon({
            iconUrl: 'http://i.imgur.com/iau54EZ.png',
            iconAnchor: [16, 16]
        });
        var anim = window.setInterval(function() {
            arrowHead.setPatterns([
                //{offset: arrowOffset+'%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 15, polygon: false, pathOptions: {stroke: true}})}
                {
                    offset: arrowOffset+'%',
                    repeat: 0,
                    symbol: L.Symbol.marker({
                        // rotate: true,
                        markerOptions: {
                            icon: bikeIcon,
                        }
                    })
                }
            ]);
            arrowOffset += 1;
            if(arrowOffset > 100)
                arrowOffset = 0;
        }, 50);

        /*var markerLine = L.polyline([[58.44773, -28.65234], [52.9354, -23.33496], [53.01478, -14.32617], [58.1707, -10.37109], [59.68993, -0.65918]], {}).addTo(map);
        var markerPatterns = L.polylineDecorator(markerLine, {
            patterns: [
                { offset: '5%', repeat: '10%', symbol: L.Symbol.marker({
                    markerOptions: {
                        icon: 'http://www.wheatonbible.org/Content/10713/Icons/map-marker.png'
                    }
                }) }
            ]
        }).addTo(map);

    }
  }*/
});