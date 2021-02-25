import { validationResult } from "express-validator";
import disconnectService from "../services/disconnectService";

const deleteUser = async (req, res) => {
  const errorsAll = [];
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const errors = Object.values(validationErrors.mapped());
    errors.forEach((error) => {
      errorsAll.push(error.msg);
    });
    req.flash("errors", errorsAll);
    return res.redirect("/disconnect");
  }
  const deleteUser = {
    id: req.body.id,
    password: req.body.password,
    role: req.body.role,
    disconnect: req.body.disconnect,
  };
  try {
    await disconnectService.deleteUser(deleteUser);
    return res.redirect("/login");
  } catch (e) {
    req.flash("errors", e);
    return res.redirect("/disconnect");
  }
};

module.exports = {
  deleteUser: deleteUser,
};
