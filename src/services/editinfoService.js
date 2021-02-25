import connection from "../configs/connectDB";
import bcryptjs from "bcryptjs";

const editUser = (user) => {
  return new Promise((resolve, reject) => {
    try {
      // hash the password
      const today = new Date();
      const salt = bcryptjs.genSaltSync(10);
      const id = user.id;
      const password = bcryptjs.hashSync(user.password, salt);
      const role = user.role;
      if (role === "관리자") {
        connection.query(
          "UPDATE ADMINISTRATOR SET PASSWORD = ? WHERE ID = ?",
          [password, id],
          function (error, rows) {
            if (error) {
              reject(error);
            }
            resolve("Create a new user successfully");
          }
        );
      }

      if (role === "식당") {
        const name = user.name;
        const gender = user.gender;
        const address = user.address;
        const birthdate = user.birthdate;
        const pnum = user.pnum;
        const age = today.getFullYear() - user.birthdate.substring(0, 4) + 1;
        const rname = user.rname;
        const rlocate = user.rlocate;
        const rpnum = user.rpnum;
        connection.query(
          "UPDATE SUBMITTER SET PASSWORD = ?, NAME = ?, GENDER = ?, ADDRESS = ?, BIRTHDATE = ?, PNUM = ?, AGE = ?, RNAME = ?, RLOCATE = ?, RPNUM = ? WHERE ID = ?",
          [
            password,
            name,
            gender,
            address,
            birthdate,
            pnum,
            age,
            rname,
            rlocate,
            rpnum,
            id,
          ],
          function (error, rows) {
            if (error) {
              reject(error);
            }
            resolve("Update a user successfully");
          }
        );
      } else if (role === "보건소") {
        const name = user.name;
        const gender = user.gender;
        const address = user.address;
        const birthdate = user.birthdate;
        const pnum = user.pnum;
        const age = today.getFullYear() - user.birthdate.substring(0, 4) + 1;
        connection.query(
          "UPDATE submitter SET PASSWORD = ?, NAME = ?, GENDER = ?, ADDRESS = ?, BIRTHDATE = ?, PNUM = ?, AGE = ? WHERE ID = ?",
          [password, name, gender, address, birthdate, pnum, age, id],
          function (error, rows) {
            if (error) {
              reject(error);
            }
            resolve("Update a user successfully");
          }
        );
      } else if (role === "평가자") {
        const name = user.name;
        const gender = user.gender;
        const address = user.address;
        const birthdate = user.birthdate;
        const pnum = user.pnum;
        const age = today.getFullYear() - user.birthdate.substring(0, 4) + 1;
        connection.query(
          "UPDATE ESTIMATOR SET PASSWORD = ?, NAME = ?, GENDER = ?, ADDRESS = ?, BIRTHDATE = ?, PNUM = ?, AGE = ? WHERE ID =?",
          [password, name, gender, address, birthdate, pnum, age, id],
          function (error, rows) {
            if (error) {
              reject(error);
            }
            resolve("Update a user successfully");
          }
        );
      }
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  editUser: editUser,
};