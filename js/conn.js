// Click events for sizing the videos
// function applySizingHandler() {
//   var videos = document.getElementsByClassName('media-container');
//   for (var i = 0; i < videos.length; i++) {
//     videos[i].addEventListener('click', function() {
//       var current = this.style.width;
//       if (current === '100%') {
//         this.style.width = '25%';
//       } else {
//         this.style.width = '100%';
//       }
//     }, false);
//   }
// }

// ......................................................
// .......................UI Code........................
// ......................................................

document.getElementById('join-room').onsubmit = function(e) {
  e.preventDefault();
  var room_id = document.getElementById('room-id').value;
  if (room_id) {
    room_id = room_id.toLowerCase();
    showRoomURL(room_id);
    stateChangeEnable();
    connection.openOrJoin(room_id, function(_isExistingRoom, _roomid) {
      connection.extra.user = randomUser();
    });
  }
  return false;
}

document.getElementById('change-username').onsubmit = function(e) {
  e.preventDefault();
  var username = document.getElementById('new-username').value;
  if (username) {
    this.className += ' hide';
    connection.extra.modifiedValue = 'username';
    connection.extra.user.name = username;
    updateUserChatName(connection.extra.user);
    connection.updateExtraData();
  }
  return false;
}

function randomUser() {
  var value = Math.floor(Math.random() * 426468864654);
  return { id: value, name: value };
}

document.getElementById('btn-leave-room').onclick = function() {
  if(connection.isInitiator) {
    // use this method if you did NOT set "autoCloseEntireSession===true"
    // for more info: https://github.com/muaz-khan/RTCMultiConnection#closeentiresession
    connection.closeEntireSession();
  } else {
    connection.leave();
  }

  window.location = '/';
};

function stateChangeEnable() {
  document.getElementById('welcome').className = 'hide';
  document.getElementById('streaming').classList.remove('hide');
}

function stateChangeDisable() {
  document.getElementById('streaming').className = 'hide';
  document.getElementById('welcome').classList.remove('hide');
}

// ......................................................
// ................FileSharing/TextChat Code.............
// ......................................................

// document.getElementById('share-file').onclick = function() {
//     var fileSelector = new FileSelector();
//     fileSelector.selectSingleFile(function(file) {
//         connection.send(file);
//     });
// }; // HUNTER

document.getElementById('input-text-chat').onkeyup = function(e) {
  if (e.keyCode != 13) return;

  // removing trailing/leading whitespace
  this.value = this.value.replace(/^\s+|\s+$/g, '');
  if (!this.value.length) return;

  message = { from: connection.extra.user, body: this.value };
  connection.send(message);
  addMessageToChat(message);
  this.value = '';
};

var chatContainer = document.getElementById('chat-output');

function addMessageToChat(message) {
  var user = message.from || message.data.from;
  var body = message.body || message.data.body;
  var tile = document.createElement('div');
  tile.className = 'tile';

  var html = "<div class='tile-content'>\
                <div>" + body + "</div>\
                <small class='chat-author' data-userid='" + user.id + "'>" + user.name + "</small>\
              </div>";
  tile.innerHTML = html;
  tile.tabIndex = 0;
  chatContainer.appendChild(tile);
  tile.focus();

  document.getElementById('input-text-chat').focus();
}

function updateUserChatName(user) {
  chats = document.querySelectorAll(".chat-author[data-userid='" + user.id + "']");
  for (var i = 0; i < chats.length; i++) {
    chats[i].innerHTML = user.name;
  }
}

// ......................................................
// ..................RTCMultiConnection Code.............
// ......................................................

var connection = new RTCMultiConnection();

// by default, socket.io server is assumed to be deployed on your own URL
connection.socketURL = '/';

// comment-out below line if you do not have your own socket.io server
// connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

connection.socketMessageEvent = 'hangout-ninja-session';

connection.enableFileSharing = true; // by default, it is "false".

connection.session = {
  audio: true,
  video: true,
  data: true
};

connection.sdpConstraints.mandatory = {
  OfferToReceiveAudio: true,
  OfferToReceiveVideo: true
};

connection.videosContainer = document.getElementById('videos-container');
connection.onstream = function(event) {
  var width = parseInt(connection.videosContainer.clientWidth / 2) - 20; // HUNTER
  // var width = '25%';
  var mediaElement = getMediaElement(event.mediaElement, {
    title: event.userid,
    // buttons: ['full-screen'], // HUNTER
    buttons: ['mute-audio'], // HUNTER
    width: width,
    showOnMouseEnter: false
  });

  connection.videosContainer.appendChild(mediaElement);

  setTimeout(function() {
    mediaElement.media.play();
  }, 5000);

  mediaElement.id = event.streamid;
};

connection.onstreamended = function(event) {
  var mediaElement = document.getElementById(event.streamid);
  if(mediaElement) {
    mediaElement.parentNode.removeChild(mediaElement);
  }
};

connection.onmessage = addMessageToChat;
// connection.filesContainer = document.getElementById('file-container'); // HUNTER

// When a new user joins...
connection.onopen = function(event) {
  // document.querySelector('h1').innerHTML = 'You are connected with: ' + connection.getAllParticipants().join(', '); // HUNTER
};

connection.onclose = function() {
  if (connection.getAllParticipants().length) {
    // document.querySelector('h1').innerHTML = 'You are still connected with: ' + connection.getAllParticipants().join(', '); // HUNTER
  } else {
    // document.querySelector('h1').innerHTML = 'Seems session has been closed or all participants left.'; // HUNTER
  }
};

connection.onEntireSessionClosed = function(event) {
  connection.attachStreams.forEach(function(stream) {
    stream.stop();
  });

  connection.leave();

  stateChangeDisable();
  // don't display alert for moderator
  if(connection.userid === event.userid) return;

  document.getElementById('alert').innerHTML = 'Master Ninja has ended the session';

  setTimeout(function() {
   window.location = '/';
  }, 5000);
};

connection.onUserIdAlreadyTaken = function(useridAlreadyTaken, yourNewUserId) {
  // seems room is already opened
  connection.join(useridAlreadyTaken);
};

connection.onExtraDataUpdated = function(event) {
  var modifiedValue = event.extra.modifiedValue;
  switch (modifiedValue) {
    case 'username':
      updateUserChatName(event.extra.user);
      break;
    default:
      // undhandled modifiedValue
  }
};

function disableInputButtons() {
}


// ......................................................
// ......................Handling Room-ID................
// ......................................................

function showRoomURL(roomid) {
  var roomurl = '?roomid=' + roomid;
  var wrapper = document.getElementById('room-url');
  var html = "<div class='pt-5 pb-5'>\
                <a href='" + roomurl + "' target='_blank'>" + roomid + "</a>\
              </div>";
  wrapper.innerHTML = html;
}

(function() {
  var params = {},
      r = /([^&=]+)=?([^&]*)/g;

  function d(s) {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  }
  var match, search = window.location.search;
  while (match = r.exec(search.substring(1)))
    params[d(match[1])] = d(match[2]);
  window.params = params;
})();

var roomid = params.roomid;

if(roomid && roomid.length) {
  roomid = roomid.toLowerCase();
  document.getElementById('room-id').value = roomid;
  // roomid = localStorage.getItem(connection.socketMessageEvent);
  // localStorage.setItem(connection.socketMessageEvent, roomid);

  // auto-join-room
  (function reCheckRoomPresence() {
    connection.checkPresence(roomid, function(isRoomExists) {
      if(isRoomExists) {
        showRoomURL(roomid);
        stateChangeEnable();
        connection.join(roomid, function() {
          connection.extra.user = randomUser();
        });
        return;
      }

      setTimeout(reCheckRoomPresence, 5000);
    });
  })();
}
