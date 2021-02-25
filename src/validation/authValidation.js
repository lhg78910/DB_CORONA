import { check } from "express-validator";

const validateRegister = [
  check("password", "비밀번호는 3자리 이상이어야 합니다.").isLength({ min: 3 }),
  check("confirmPassword", "비밀번호가 일치하지 않습니다.").custom(
    (value, { req }) => {
      return value === req.body.password;
    }
  ),
];

module.exports = {
  validateRegister: validateRegister,
};
