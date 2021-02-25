import connection from "../configs/connectDB";
import bcrypt from "bcryptjs";

const handleLogin = (id, password) => {
  return new Promise(async (resolve, reject) => {
    const user = await findUserById(id);
    if (user) {
      await bcrypt
        .compare(password.toString(), user.PASSWORD)
        .then((isMatch) => {
          if (isMatch) resolve(true);
          else reject(`잘못된 비밀번호입니다.`);
        });
    } else {
      reject(`존재하지 않는 아이디입니다.`);
    }
  });
};

const findUserById = (id) => {
  return new Promise((resolve, reject) => {
    try {
      connection.query(
        "SELECT * FROM SUBMITTER WHERE ID = ?",
        id,
        function (error, rows) {
          if (error) {
            reject(error);
          }
          // the user is a submitter
          if (rows.length > 0) {
            resolve(rows[0]);
          }
        }
      );
      connection.query(
        "SELECT * FROM ESTIMATOR WHERE ID = ?",
        id,
        function (error, rows) {
          if (error) {
            reject(error);
          }
          // the user is a estimator
          if (rows.length > 0) {
            resolve(rows[0]);
          }
        }
      );
      connection.query(
        "SELECT * FROM ADMINISTRATOR WHERE ID = ?",
        id,
        function (error, rows) {
          if (error) {
            reject(error);
          }
          // the user is a administrator
          if (rows.length > 0) {
            resolve(rows[0]);
          } else {
            resolve(false);
          }
        }
      );
    } catch (e) {
      reject(e);
    }
  });
};

const comparePasswordUser = (user, password, id) => {
  return new Promise(async (resolve, reject) => {
    try {
      await bcrypt
        .compare(password.toString(), user.PASSWORD)
        .then((isMatch) => {
          if (isMatch) resolve(true);
          else resolve("잘못된 비밀번호입니다.");
        });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  handleLogin: handleLogin,
  findUserById: findUserById,
  comparePasswordUser: comparePasswordUser,
};
