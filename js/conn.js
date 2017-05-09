// Click events for sizing the videos
function applySizingHandler() {
  var videos = document.getElementsByClassName('media-container');
  for (var i = 0; i < videos.length; i++) {
    videos[i].addEventListener('click', function() {
      var current = this.style.width;
      if (current === '100%') {
        this.style.width = '25%';
      } else {
        this.style.width = '100%';
      }
    }, false);
  }
}

// ......................................................
// .......................UI Code........................
// ......................................................

document.getElementById('join-room').onsubmit = function(e) {
  e.preventDefault();
  connection.open(document.getElementById('room-id').value, function() {
    showRoomURL(connection.sessionid);
    stateChangeEnable();
  });
  return false;
};

// document.getElementById('join-room').onclick = function() {
//   disableInputButtons();
//   connection.join(document.getElementById('room-id').value);
// };

// document.getElementById('open-or-join-room').onclick = function() {
//     disableInputButtons();
//     connection.openOrJoin(document.getElementById('room-id').value, function(isRoomExists, roomid) {
//         if(!isRoomExists) {
//             showRoomURL(roomid);
//         }
//     });
// };

document.getElementById('btn-leave-room').onclick = function() {
  if(connection.isInitiator) {
    // use this method if you did NOT set "autoCloseEntireSession===true"
    // for more info: https://github.com/muaz-khan/RTCMultiConnection#closeentiresession
    connection.closeEntireSession(function() {
      // document.querySelector('h1').innerHTML = 'Entire session has been closed.'; // HUNTER
    });
  } else {
    connection.leave();
  }

  window.location = '/index.html';
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

  connection.send(this.value);
  appendDIV(this.value);
  this.value = '';
};

var chatContainer = document.getElementById('chat-output');

function appendDIV(event) {
  var tile = document.createElement('div');
  tile.className = 'tile';
  var content = document.createElement('div');
  content.className = 'tile-content';
  content.innerHTML = event.data || event;
  tile.appendChild(content);
  tile.tabIndex = 0;
  chatContainer.appendChild(tile);
  tile.focus();

  document.getElementById('input-text-chat').focus();
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
  // var width = parseInt(connection.videosContainer.clientWidth / 2) - 20; // HUNTER
  var width = '25%';
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

  showRoomURL(connection.sessionid);

  applySizingHandler();
};

connection.onstreamended = function(event) {
  var mediaElement = document.getElementById(event.streamid);
  if(mediaElement) {
    mediaElement.parentNode.removeChild(mediaElement);
  }
};

connection.onmessage = appendDIV;
// connection.filesContainer = document.getElementById('file-container'); // HUNTER

connection.onopen = function() {
  // document.getElementById('share-file').disabled = false; // HUNTER
  // document.getElementById('input-text-chat').disabled = false;
  // document.getElementById('btn-leave-room').disabled = false; // HUNTER
  // document.getElementById('btn-leave-room').classList.remove('hide'); // HUNTER
  // document.getElementById('connect-room').className += ' hide'; // HUNTER

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
  // document.getElementById('share-file').disabled = true; // HUNTER
  // document.getElementById('input-text-chat').disabled = true;
  // document.getElementById('btn-leave-room').disabled = true; // HUNTER
  // document.getElementById('btn-leave-room').className += ' hide'; // HUNTER 

  // document.getElementById('open-or-join-room').disabled = false; // HUNTER
  // document.getElementById('connect-room').classList.remove('hide'); // HUNTER
  // document.getElementById('open-room').disabled = false; // HUNTER
  // document.getElementById('join-room').disabled = false; // HUNTER
  // document.getElementById('room-id').disabled = false; // HUNTER

  connection.attachStreams.forEach(function(stream) {
    stream.stop();
  });

  connection.leave();

  stateChangeDisable();
  // don't display alert for moderator
  if(connection.userid === event.userid) return;

  document.getElementById('alert').innerHTML = 'Master Ninja has ended the session';

  setTimeout(function() {
   window.location = '/index.html';
  }, 5000);
  // document.querySelector('h1').innerHTML = 'Entire session has been closed by the moderator: ' + event.userid; // HUNTER
};

connection.onUserIdAlreadyTaken = function(useridAlreadyTaken, yourNewUserId) {
  // seems room is already opened
  connection.join(useridAlreadyTaken);
};

function disableInputButtons() {
}

// ......................................................
// ......................Handling Room-ID................
// ......................................................

function showRoomURL(roomid) {
  var roomQueryStringURL = '?roomid=' + roomid;
  var html = '<span class="pr-5">Room Link:</span>'

  html += '<a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';
  var roomURLsDiv = document.getElementById('room-url');
  roomURLsDiv.innerHTML = html;
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
if (!roomid && localStorage.getItem(connection.socketMessageEvent)) {
  roomid = localStorage.getItem(connection.socketMessageEvent);
} else {
  // roomid = connection.token(); // HUNTER
}
// if (roomid) { document.getElementById('room-id').value = roomid; }
// document.getElementById('room-id').onkeyup = function() {
//   localStorage.setItem(connection.socketMessageEvent, this.value);
// };

if(roomid && roomid.length) {
  document.getElementById('room-id').value = roomid;
  localStorage.setItem(connection.socketMessageEvent, roomid);

  // auto-join-room
  (function reCheckRoomPresence() {
    connection.checkPresence(roomid, function(isRoomExists) {
      if(isRoomExists) {
        connection.join(roomid);
        stateChangeEnable();
        return;
      }

      setTimeout(reCheckRoomPresence, 5000);
    });
  })();

  // disableInputButtons();
}
