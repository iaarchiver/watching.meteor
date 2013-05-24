Watcher = new Meteor.Collection('watchers');

if (Meteor.isClient){
  var user_id;

  Meteor.subscribe('watch',function(){
    if ((sessionStorage.user_id == undefined) && !Watcher.find({_id: user_id}).count()){
      user_id = Watcher.insert({last_keepalive : (new Date()).getTime()});
      Session.set('user_id',user_id);
      sessionStorage.setItem('user_id',user_id);
    }
    Watcher.find().observe({
        added: function (){
          var notifier = document.getElementById('notifier');
          notifier.style.webkitAnimationPlayState = 'running';
          
          setTimeout(function(){
            notifier.style.webkitAnimationPlayState = 'paused';
          },2*1000);
        },
        removed: function(){
          document.getElementById('counter').style.webkitAnimationPlayState = 'running';
        }
    });
  });

  var isReady = function(){

    if (Watcher.find({last_modified:{$gt:(new Date()).getTime() - 16*1000}}).count()){
      return true;
    }else{
      Meteor.call('checkready', function(error, result) {
        if (error !== undefined) console.log(error);
      });
      return false;
    }
  }

  Meteor.setInterval(function(){
    if (!isReady()) return false;

    user_id = Session.get('user_id') || sessionStorage.user_id;
    if (!Watcher.find({_id: user_id}).count()){
      Watcher.insert({_id: user_id,last_keepalive: (new Date()).getTime()});
    }else{
      Watcher.update(
        {_id: user_id},
        {$set: {last_keepalive:(new Date()).getTime()}}
        );
    }
  },1500)

  Template.show_counter.isReady = function(){ return isReady();};
  Template.show_counter.count = function(){ return Watcher.find({last_modified:{$exists:false}}).count() };
}
 
if (Meteor.isServer) {
  var timestamp;

  var touchDB = function(db){

    if (!db.find({last_modified:{$exists:true}}).count()){
      timestamp = db.insert({last_modified:(new Date()).getTime()});
    }else{
      timestamp = db.find({last_modified:{$exists:true}}).fetch()[0]._id;
      db.update({_id:timestamp},{$set:{last_modified:(new Date()).getTime()}});
    }
  };

  Meteor.publish('watch',function(){
    return Watcher.find({});
  });
  Meteor.methods( {
    checkready: function() { touchDB(Watcher);}
  });
  Meteor.setInterval(function(){
    Watcher.remove({last_keepalive:{$lt: (new Date()).getTime() - 4*1000}});
  },2*1000);
}

