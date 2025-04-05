const socket = io("https://omegle2-yas3.onrender.com");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let localStream;
let peerConnection;
let isAudioMuted = false;
let isVideoOff = false;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
  localStream = stream;
  localVideo.srcObject = stream;
  socket.emit("join");
});

function createPeer() {
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("candidate", e.candidate);
    }
  };

  peerConnection.ontrack = (e) => {
    remoteVideo.srcObject = e.streams[0];
  };
}

socket.on("init", () => {
  createPeer();
  peerConnection.createOffer().then((offer) => {
    peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);
  });
});

socket.on("offer", (offer) => {
  createPeer();
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
    peerConnection.createAnswer().then((answer) => {
      peerConnection.setLocalDescription(answer);
      socket.emit("answer", answer);
    });
  });
});

socket.on("answer", (answer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("candidate", (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", () => {
  if (peerConnection) peerConnection.close();
  peerConnection = null;
  remoteVideo.srcObject = null;
});

// Control buttons
document.getElementById("muteBtn").onclick = () => {
  isAudioMuted = !isAudioMuted;
  localStream.getAudioTracks()[0].enabled = !isAudioMuted;
};

document.getElementById("videoBtn").onclick = () => {
  isVideoOff = !isVideoOff;
  localStream.getVideoTracks()[0].enabled = !isVideoOff;
};

document.getElementById("endBtn").onclick = () => {
  socket.disconnect();
  if (peerConnection) peerConnection.close();
  peerConnection = null;
  remoteVideo.srcObject = null;
  alert("Call ended.");
};

document.getElementById("nextBtn").onclick = () => {
  socket.emit("join"); // trigger rejoin (simple match logic)
};
