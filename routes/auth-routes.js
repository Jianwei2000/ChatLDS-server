const router = require("express").Router();
const User = require("../models/user-model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//註冊用戶
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  //確認信箱是否已被註冊
  const foundEmail = await User.findOne({ email }).exec();
  if (foundEmail) {
    return res.status(400).send("此信箱已被註冊");
  }

  //密碼加密
  const hashedPassword = await bcrypt.hash(password, 12);
  //新增用戶
  const newUser = new User({ name, email, password: hashedPassword });
  try {
    const saveUser = await newUser.save();
    return res.send({
      msg: "恭喜註冊成功，現在可以登入系統了",
      saveUser,
    });
  } catch (e) {
    return res.status(500).send({ msg: "無法存取使用者", e });
  }
});

//登入用戶
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  //確認信箱是否存在
  const foundEmail = await User.findOne({ email });
  if (!foundEmail) {
    return res.status(401).send("無法找到使用者，請確認信箱是否正確");
  }
  //比對密碼
  const isMatch = await bcrypt.compare(password, foundEmail.password);

  if (!isMatch) {
    return res.status(401).send("密碼錯誤");
  }

  //製作json web token
  const tokenObj = {
    _id: foundEmail._id,
    email: foundEmail.email,
  };
  const token = jwt.sign(tokenObj, process.env.PASSPORT_SECRET);

  // 不要回傳密碼給前端
  const userForClient = {
    _id: foundEmail._id,
    name: foundEmail.name,
    email: foundEmail.email,
    thumbnail: foundEmail.thumbnail,
  };

  return res.send({
    msg: "登入成功",
    token: "Bearer " + token,
    user: userForClient,
  });
});

module.exports = router;
