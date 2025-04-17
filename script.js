let peer;
let conn;
let peerId = "";
let isHost = false;
let roomId = "";
let roomPass = "";
let connectedClients = 0;

const setupDiv = document.getElementById("setup");
const chatDiv = document.getElementById("chat");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const exitBtn = document.getElementById("exitBtn");

document.getElementById("createBtn").onclick = () => {
  roomId = document.getElementById("roomId").value.trim();
  roomPass = document.getElementById("roomPass").value.trim();

  if (!roomId || !roomPass) {
    alert("Enter Room ID and Password");
    return;
  }

  isHost = true;
  peerId = "room-" + roomId;

  peer = new Peer(peerId, { debug: 2 });

  peer.on("open", () => {
    startChat(); // Host enters chat immediately
    console.log("Host peer ready:", peerId);
  });

  peer.on("connection", (connection) => {
    if (connectedClients >= 1) {
      connection.close(); // Only 1 guest allowed
      return;
    }

    connection.on("data", (data) => {
      if (data.type === "auth") {
        if (data.pass === roomPass) {
          conn = connection;
          conn.send({ type: "auth", status: "success" });
          connectedClients++;
        } else {
          conn.send({ type: "auth", status: "fail" });
          connection.close();
        }
      } else if (data.type === "msg") {
        addMessage("Friend: " + data.text);
      }
    });

    connection.on("close", () => {
      connectedClients = 0;
      alert("Friend disconnected.");
      if (isHost) {
        endSession();
      }
    });
  });

  peer.on("disconnected", () => {
    connectedClients = 0;
  });

  peer.on("error", (err) => {
    alert("Error: " + err.message);
  });
};

document.getElementById("joinBtn").onclick = () => {
  roomId = document.getElementById("roomId").value.trim();
  roomPass = document.getElementById("roomPass").value.trim();

  if (!roomId || !roomPass) {
    alert("Enter Room ID and Password");
    return;
  }

  peer = new Peer(null, { debug: 2 });

  peer.on("open", () => {
    conn = peer.connect("room-" + roomId);

    conn.on("open", () => {
      conn.send({ type: "auth", pass: roomPass });
    });

    conn.on("data", (data) => {
      if (data.type === "auth") {
        if (data.status === "success") {
          startChat();
        } else {
          alert("Wrong password!");
          conn.close();
        }
      } else if (data.type === "msg") {
        addMessage("Friend: " + data.text);
      }
    });

    conn.on("close", () => {
      alert("Host disconnected.");
      endSession();
    });
  });

  peer.on("error", (err) => {
    alert("Error: " + err.message);
  });
};

sendBtn.onclick = () => {
  const text = messageInput.value.trim();
  if (text && conn && conn.open) {
    addMessage("You: " + text);
    conn.send({ type: "msg", text: text });
    messageInput.value = "";
  }
};

exitBtn.onclick = () => {
  if (conn) conn.close();
  if (peer) peer.destroy();
  endSession();
};

function startChat() {
  setupDiv.style.display = "none";
  chatDiv.style.display = "block";
}

function endSession() {
  setupDiv.style.display = "block";
  chatDiv.style.display = "none";
  messagesDiv.innerHTML = "";
  conn = null;
  peer = null;
  peerId = "";
  isHost = false;
  connectedClients = 0;
  console.clear(); // Remove local history
}

function addMessage(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
