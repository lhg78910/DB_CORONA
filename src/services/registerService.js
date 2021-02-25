import connection from "../configs/connectDB";
import bcryptjs from "bcryptjs";

const createNewUser = (user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const check = await checkIdExist(user.id);
      if (check) {
        reject(
          `'${user.id}'는 이미 존재하는 아이디입니다. 
          다른 아이디를 사용해주세요`
        );
      } else {
        // hash the password
        const today = new Date();
        const salt = bcryptjs.genSaltSync(10);
        const data = {
          id: user.id,
          password: bcryptjs.hashSync(user.password, salt),
          name: user.name,
          gender: user.gender,
          address: user.address,
          birthdate: user.birthdate,
          pnum: user.pnum,
          age: today.getFullYear() - user.birthdate.substring(0, 4) + 1,
          role: user.role,
        };
        if (data.role === "R") {
          data.rname = user.rname;
          data.rlocate = user.rlocate;
          data.rpnum = user.rpnum;

          connection.query(
            "INSERT INTO SUBMITTER SET ?",
            data,
            function (error, rows) {
              if (error) {
                reject(error);
              }
              resolve("Create a new user successfully");
            }
          );
        } else if (user.role === "H") {
          connection.query(
            "INSERT INTO SUBMITTER SET ?",
            data,
            function (error, rows) {
              if (error) {
                reject(error);
              }
              resolve("Create a new user successfully");
            }
          );
        } else if (user.role === "E") {
          connection.query(
            "INSERT INTO ESTIMATOR SET ?",
            data,
            function (error, rows) {
              if (error) {
                reject(error);
              }
              resolve("Create a new user successfully");
            }
          );
        }
      }
    } catch (e) {
      reject(e);
    }
  });
};

const checkIdExist = (id) => {
  return new Promise((resolve, reject) => {
    try {
      let status = false;
      connection.query(
        "SELECT * FROM SUBMITTER WHERE ID = ?",
        id,
        function (error, rows) {
          if (error) {
            reject(error);
          }
          if (rows.length > 0) {
            resolve(true);
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
          if (rows.length > 0) {
            resolve(true);
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
          if (rows.length > 0) {
            resolve(true);
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

module.exports = {
  createNewUser: createNewUser,
};
