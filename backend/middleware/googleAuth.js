const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../config/db');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const nome = profile.displayName;

    const [existing] = await pool.execute('SELECT * FROM utilizador WHERE email = ?', [email]);

    let user;
    if (existing.length === 0) {
      const [result] = await pool.execute(
        'INSERT INTO utilizador (nome, email, password) VALUES (?, ?, ?)',
        [nome, email, null]
      );
      user = { id_utilizador: result.insertId, nome, email };
    } else {
      user = existing[0];
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));
