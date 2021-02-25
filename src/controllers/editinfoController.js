import { validationResult } from "express-validator";
import editinfoService from "../services/editinfoService";

const updateUser = async (req, res) => {
  const errorsAll = [];
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const errors = Object.values(validationErrors.mapped());
    errors.forEach((error) => {
      errorsAll.push(error.msg);
    });
    req.flash("errors", errorsAll);
    return res.redirect("/editinfo");
  }
  const updateUser = {
    id: req.body.id,
    password: req.body.password,
    name: req.body.name,
    gender: req.body.gender,
    address: req.body.address,
    birthdate: req.body.birthdate,
    pnum: req.body.pnum,
    role: req.body.role,
    rname: req.body.rname,
    rlocate: req.body.rlocate,
    rpnum: req.body.rpnum,
  };
  try {
    await editinfoService.editUser(updateUser);
    return res.redirect("/userinfo");
  } catch (e) {
    req.flash("errors", e);
    return res.redirect("/userinfo");
  }
};

module.exports = {
  updateUser: updateUser,
};
