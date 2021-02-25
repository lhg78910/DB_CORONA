import connection from "../configs/connectDB";
import bcrypt from "bcryptjs";

const deleteUser = (user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const id = user.id;
      const password = user.password;
      const role = user.role;
      const disconnect = user.disconnect;
      const foundUser = await findUserById(id, role);
      await bcrypt
        .compare(password.toString(), foundUser.PASSWORD)
        .then((isMatch) => {
          if (!isMatch) {
            reject(`잘못된 비밀번호입니다.`);
          } else if (isMatch && disconnect === "A") {
            if (role === "R" || role === "H") {
              connection.query(
                "DELETE FROM SUBMITTER WHERE ID = ?",
                id,
                function (error, rows) {
                  if (error) {
                    reject(error);
                  }
                  resolve("Delete a user successfully");
                }
              );
            } else if (role === "E") {
              connection.query(
                "DELETE FROM ESTIMATOR WHERE ID = ?",
                id,
                function (error, rows) {
                  if (error) {
                    reject(error);
                  }
                  resolve("Delete a user successfully");
                }
              );
            }
          } else reject(`회원 탈퇴가 되지 않았습니다.`);
        });
    } catch (e) {
      reject(e);
    }
  });
};

const findUserById = (id, role) => {
  return new Promise((resolve, reject) => {
    try {
      if (role === "R" || role === "H") {
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
      } else if (role === "E") {
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
      }
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  deleteUser: deleteUser,
  findUserById: findUserById,
};
