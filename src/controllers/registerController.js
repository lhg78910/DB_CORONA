import { validationResult } from "express-validator";
import registerService from "../services/registerService";

const getRegisterPage = (req, res) => {
  return res.render("register.ejs", {
    errors: req.flash("errors"),
  });
};

const createNewUser = async (req, res) => {
  const errorsAll = [];
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const errors = Object.values(validationErrors.mapped());
    errors.forEach((error) => {
      errorsAll.push(error.msg);
    });
    req.flash("errors", errorsAll);
    return res.redirect("/register");
  }

  const newUser = {
    id: req.body.id,
    password: req.body.password,
    name: req.body.name,
    gender: req.body.gender,
    address: req.body.address,
    birthdate: req.body.birthdate,
    pnum: req.body.pnum,
    role: req.body.role,
  };
  if (newUser.role === "R") {
    newUser.rname = req.body.rname;
    newUser.rlocate = req.body.rlocate;
    newUser.rpnum = req.body.rpnum;
  }
  try {
    await registerService.createNewUser(newUser);
    return res.redirect("/login");
  } catch (e) {
    req.flash("errors", e);
    return res.redirect("/register");
  }
};

module.exports = {
  getRegisterPage: getRegisterPage,
  createNewUser: createNewUser,
};
