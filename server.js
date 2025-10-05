const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const httpServer = require("http").createServer(app);
const socketio = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
require("./config/passport");

const initSocket = require("./sockets");
const authRoute = require("./routes/auth-routes");
const googleRoute = require("./routes/google-routes");

// 建立 Socket.IO server，掛載在 HTTP server 上
const io = new socketio.Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL, //前端網址
    methods: ["GET", "POST"],
  },
});

//初始化socket.io
initSocket(io);

//連接mongoDB
mongoose
  .connect(process.env.MONGODB_ATLAS)
  .then(() => console.log("ChatDB連線成功"))
  .catch((e) => console.log(e));

//中介軟體
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(passport.initialize());

//路由設定
app.use("/api/auth", authRoute); //登入、註冊API
app.use("/google", googleRoute); //google第三方登入

//server啟動
httpServer.listen(PORT, () => {
  console.log(`後端server已啟動，端口:${PORT}...`);
});
