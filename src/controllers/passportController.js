import passport from "passport";
import passportLocal from "passport-local";
import loginService from "../services/loginService";

const LocalStrategy = passportLocal.Strategy;

const initPassportLocal = () => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "id",
        passwordField: "password",
        passReqToCallback: true,
      },
      // check whether the user exists
      async (req, id, password, done) => {
        try {
          let user = await loginService.findUserById(id);
          if (!user) {
            return done(
              null,
              false,
              req.flash("errors", `'${id}'는 존재하지 않는 회원입니다.`)
            );
          }
          if (user) {
            const match = await loginService.comparePasswordUser(
              user,
              password,
              id
            );
            if (match === true) {
              return done(null, user, null);
            } else {
              return done(null, false, req.flash("errors", match));
            }
          }
        } catch (err) {
          console.log(err);
          return done(null, false, err);
        }
      }
    )
  );
};

passport.serializeUser((user, done) => {
  done(null, user.ID);
});

passport.deserializeUser((id, done) => {
  loginService
    .findUserById(id)
    .then((user) => {
      return done(null, user);
    })
    .catch((error) => {
      return done(error, null);
    });
});

module.exports = initPassportLocal;
