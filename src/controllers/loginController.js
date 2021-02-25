import { validationResult } from "express-validator";
import loginService from "../services/loginService";

const getLoginPage = (req, res) => {
  return res.render("login.ejs", {
    errors: req.flash("errors"),
  });
};

const handleLogin = async (req, res) => {
  const errorsAll = [];
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const errors = Object.values(validationErrors.mapped());
    errors.forEach((error) => {
      errorsAll.push(error.msg);
    });
    req.flash("errors", errorsAll);
    return res.redirect("/login");
  }
  try {
    await loginService.handleLogin(req.body.id, req.body.password);
    return res.redirect("/");
  } catch (e) {
    req.flash("errors", e);
    return res.redirect("/login");
  }
};

const checkLoggedOut = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
};

const checkInfo = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/userInfo");
  }
  next();
};

const checkLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  next();
};

const postLogOut = (req, res) => {
  req.logout();
  req.session.destroy(function (err) {
    return res.redirect("/login");
  });
};

module.exports = {
  getLoginPage: getLoginPage,
  handleLogin: handleLogin,
  checkLoggedOut: checkLoggedOut,
  checkLoggedIn: checkLoggedIn,
  postLogOut: postLogOut,
};
