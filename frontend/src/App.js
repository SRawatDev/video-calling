import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "peerjs";

const socket = io("https://video-calling-1-61d5.onrender.com", {
  transports: ["websocket", "polling"],
});

const peer = new Peer();

const App = () => {
  const [myId, setMyId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(peer); // Use ref to maintain peer instance across renders

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

        // Set peer open event
        peerRef.current.on("open", (id) => {
          setMyId(id);
          socket.emit("join-room", "room1", id);
        });

        // Listen for when another user joins
        socket.on("user-connected", (userId) => {
          setRemoteId(userId);
        });

        // Handle incoming calls
        peerRef.current.on("call", (call) => {
          console.log("Incoming call... Answering");

          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
              call.answer(stream);
              call.on("stream", (remoteStream) => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = remoteStream;
                }
              });
            })
            .catch((error) => console.error("Error accessing media devices.", error));
        });
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });
  }, []);

  const callUser = () => {
    if (!remoteId) {
      console.error("No remote user to call");
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }

        const call = peerRef.current.call(remoteId, stream);
        call.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });

        call.on("error", (err) => console.error("Call error:", err));
      })
      .catch((error) => console.error("Error accessing media devices.", error));
  };

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
