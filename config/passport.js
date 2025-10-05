const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user-model");

// 設定 Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 從 Google 帳號取得 email
        const email = profile.emails[0].value;
        const foundUser = await User.findOne({ email });
        if (!foundUser) {
          const newUser = new User({
            name: profile.displayName,
            googleID: profile.id,
            thumbnail: profile.photos[0].value,
            email: profile.emails[0].value,
          });
          const saveUser = await newUser.save();
          return done(null, saveUser);
        }
        // 如果不是新用戶回傳 user 資訊
        return done(null, foundUser);
      } catch (e) {
        return done(e, null);
      }
    }
  )
);

//JWT驗證登入
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.PASSPORT_SECRET, // 密鑰
};
passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    
    try {
      const user = await User.findById(jwt_payload._id);
      
      
      if (user) {
        return done(null, user); // 把 user 放進 req.user
      }
      return done(null, false); // 沒找到
    } catch (err) {
      console.error(err);
      return done(err, false);
    }
  })
);

module.exports = passport;
