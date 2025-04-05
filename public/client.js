const socket = io("https://omegle2-yas3.onrender.com");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const status = document.getElementById("status");
const muteBtn = document.getElementById("muteBtn");
const videoBtn = document.getElementById("videoBtn");
const nextBtn = document.getElementById("nextBtn");
const endBtn = document.getElementById("endBtn");

let localStream, peerConnection, room;
let isMuted = false;
let isVideoHidden = false;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localStream = stream;
  localVideo.srcObject = stream;
  socket.emit("ready");
});

socket.on("matched", async (data) => {
  room = data.room;
  status.innerText = "Connected!";
  createConnection();
});

socket.on("signal", async (data) => {
  if (!peerConnection) createConnection();

  if (data.type === "offer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("signal", { room, data: answer });
  } else if (data.type === "answer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
  } else if (data.type === "candidate") {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

function createConnection() {
  peerConnection = new RTCPeerConnection(config);

  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("signal", { room, data: { type: "candidate", candidate: e.candidate } });
    }
  };

  peerConnection.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
  };

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.createOffer().then(offer => {
    peerConnection.setLocalDescription(offer);
    socket.emit("signal", { room, data: offer });
  });
}

// Controls
muteBtn.onclick = () => {
  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  muteBtn.innerText = isMuted ? "🔇 Unmute" : "🎤 Mute";
};

videoBtn.onclick = () => {
  isVideoHidden = !isVideoHidden;
  localStream.getVideoTracks()[0].enabled = !isVideoHidden;
  videoBtn.innerText = isVideoHidden ? "🎥 Show Video" : "🎥 Hide Video";
};

nextBtn.onclick = () => {
  if (peerConnection) peerConnection.close();
  remoteVideo.srcObject = null;
  socket.emit("ready"); // request new match
  status.innerText = "Searching for new partner...";
};

endBtn.onclick = () => {
  if (peerConnection) peerConnection.close();
  remoteVideo.srcObject = null;
  status.innerText = "Chat ended.";
};
