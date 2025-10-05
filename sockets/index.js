let queue = [];
let rooms = {};
let socketToRoom = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("使用者連線:", socket.id);

    // 使用者加入配對佇列
    socket.on("join_queue", ( token ) => {
      console.log("加入佇列:", socket.id);

      // 若 socket 已經在 queue，跳過（避免重複）
      if (queue.find((u) => u.socket.id === socket.id)) return;

      queue.push({ socket, token });

      // 如果佇列中有兩人，就配對
      if (queue.length >= 2) {
        const user1 = queue.shift();
        const user2 = queue.shift();
        const roomId = `${user1.socket.id}_${user2.socket.id}`;

        rooms[roomId] = [user1.socket, user2.socket];
        socketToRoom[user1.socket.id] = roomId;
        socketToRoom[user2.socket.id] = roomId;

        user1.socket.join(roomId);
        user2.socket.join(roomId);

        user1.socket.emit("matched", {
          roomId,
          partner: {
            name: user2.token.name,
            thumbnail: user2.token.thumbnail,
          },
        });

        user2.socket.emit("matched", {
          roomId,
          partner: {
            name: user1.token.name,
            thumbnail: user1.token.thumbnail,
          },
        });

        console.log("配對成功，房間 ID:", roomId);
      }
    });

    // 接收訊息並廣播
    socket.on("send_message", ({ roomId, content, sender }) => {
      io.to(roomId).emit("receive_message", { content, sender });
    });

    //使用者手動離開房間
    socket.on("leave_room", ({ roomId }) => {
      console.log("離開房間:", roomId);
      socket.leave(roomId);

      const roomUsers = rooms[roomId];
      if (roomUsers) {
        const other = roomUsers.find((s) => s.id !== socket.id);
        if (other) {
          other.emit("receive_message", {
            content: "對方已離開",
            sender: "系統",
          });
        }

        // 清理
        delete rooms[roomId];
        delete socketToRoom[socket.id];
        if (other) delete socketToRoom[other.id];
      }
    });

    // 斷線
    socket.on("disconnect", () => {
      console.log("使用者斷線:", socket.id);

      // 1. 從佇列移除
      queue = queue.filter((u) => u.socket.id !== socket.id);

      // 2. 通知房間另一人
      const roomId = socketToRoom[socket.id];
      if (roomId) {
        const roomUsers = rooms[roomId];
        if (roomUsers) {
          const other = roomUsers.find((s) => s.id !== socket.id);
          if (other) {
            other.emit("receive_message", {
              content: "對方已離線",
              sender: "系統",
            });
          }
        }

        // 3. 清理
        delete rooms[roomId];
        roomUsers?.forEach((s) => delete socketToRoom[s.id]);
      }
    });
  });
};
