const router = require("express").Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/user-model");

// 導向 Google 登入頁面
router.get(
  "/",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google callback
router.get(
  "/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    // 登入成功，製作json web token
    const tokenObj = {
      _id: req.user._id,
      email: req.user.email,
    };
    const token = jwt.sign(tokenObj, process.env.PASSPORT_SECRET);

    // 可以選擇：
    // 回傳 JSON 給前端 (for API only)
    // res.json({ token: "JWT " + token, user: req.user });

    // 導向前端，並帶上 JWT token
    return res.redirect(
      `${process.env.FRONTEND_URL}/googleCallback/?token=Bearer ${token}`
    );

    // return res.send({
    //   msg: "登入成功",
    //   token: "Bearer " + token,
    //   user: req.user,
    // });
  }
);

//取得用戶
router.get(
  "/getUser",
  passport.authenticate("jwt", { session: false }), // 使用 JWT 驗證
  async (req, res) => {
    try {
      const foundUser = await User.findById(req.user._id).select("-password");
      return res.json(foundUser);
    } catch (e) {
      return res.status(500).send("錯誤: " + e);
    }
  }
);

module.exports = router;
