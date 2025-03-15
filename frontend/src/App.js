
// client/src/App.js (React Frontend)
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";

const socket = io("http://192.168.1.5:4000", {
  transports: ["websocket", "polling"]
});

const peer = new Peer();

const App = () => {
  const [myId, setMyId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  console.log(myId)

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia is not supported in this browser");
      return;
    }
  
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });
  
    peer.on("open", (id) => {
      setMyId(id);
      socket.emit("join-room", "room1", id);
    });
  
    socket.on("user-connected", (userId) => {
      setRemoteId(userId);
    });
  }, []);
  

  const callUser = () => {
    if (!remoteId) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myVideoRef.current.srcObject = stream;
      const call = peer.call(remoteId, stream);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
      });
    }).catch((error) => {
      console.error("Error accessing media devices.", error);
    });
  };

  peer.on("call", (call) => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myVideoRef.current.srcObject = stream;
      call.answer(stream);
      call.on("stream", (remoteStream) => {
        remoteVideoRef.current.srcObject = remoteStream;
      });
    }).catch((error) => {
      console.error("Error accessing media devices.", error);
    });
  });

  return (
    <div>
      <h1>Video Calling App</h1>
      <video ref={myVideoRef} autoPlay playsInline style={{ width: "300px" }}></video>
      <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "300px" }}></video>
      <br />
      <button onClick={callUser}>Start Call</button>
    </div>
  );
};

export default App;
