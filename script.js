let peer;
let conn;
let isHost = false;
let correctPass = "";
let peerId = "";

const setupDiv = document.getElementById("setup");
const chatDiv = document.getElementById("chat");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const exitBtn = document.getElementById("exitBtn");

document.getElementById("createBtn").onclick = () => {
  const roomId = document.getElementById("roomId").value;
  const roomPass = document.getElementById("roomPass").value;

  if (!roomId || !roomPass) {
    alert("Enter Room ID and Password");
    return;
  }

  isHost = true;
  correctPass = roomPass;
  peerId = "room-" + roomId;

  peer = new Peer(peerId);

  peer.on("open", () => {
    console.log("Host ready with ID:", peerId);
    alert("Room created. Share ID and password with your friend.");
  });

  peer.on("connection", (connection) => {
    if (conn) {
      connection.close(); // Only allow 1 connection
      return;
    }

    connection.on("data", (data) => {
      if (data.type === "auth") {
        if (data.pass === correctPass) {
          connection.send({ type: "auth", status: "success" });
          conn = connection;
          startChat();
        } else {
          connection.send({ type: "auth", status: "fail" });
          connection.close();
        }
      } else if (data.type === "msg") {
        addMessage("Friend: " + data.text);
      }
    });
  });
};

document.getElementById("joinBtn").onclick = () => {
  const roomId = document.getElementById("roomId").value;
  const roomPass = document.getElementById("roomPass").value;

  if (!roomId || !roomPass) {
    alert("Enter Room ID and Password");
    return;
  }

  correctPass = roomPass;
  peer = new Peer();

  peer.on("open", () => {
    conn = peer.connect("room-" + roomId);

    conn.on("open", () => {
      conn.send({ type: "auth", pass: correctPass });
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
  chatDiv.style.display = "none";
  setupDiv.style.display = "block";
  messagesDiv.innerHTML = "";
  alert("Chat session ended.");
};

function startChat() {
  setupDiv.style.display = "none";
  chatDiv.style.display = "block";
}

function addMessage(msg) {
  const el = document.createElement("div");
  el.textContent = msg;
  messagesDiv.appendChild(el);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
