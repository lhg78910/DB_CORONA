import express from "express";
import connection from "../configs/connectDB";
import loginController from "../controllers/loginController";
import registerController from "../controllers/registerController";
import homePageController from "../controllers/homePageController";
import auth from "../validation/authValidation";
import passport from "passport";
import iconv from "iconv-lite";
import fs from "fs";
import initPassportLocal from "../controllers/passportController";
import editinfoController from "../controllers/editinfoController";
import disconnectController from "../controllers/disconnectController";
import estimatingController from "../controllers/estimatingController";
import uploadmodule from "../configs/setMulter";
import submitcsvmodule from "../controllers/submitCSVModule";
import path from "path";
import mime from "mime";
const router = express.Router();

initPassportLocal();

const initWebRoutes = (app) => {
  // homepage
  router.get(
    "/",
    loginController.checkLoggedIn,
    homePageController.getHomePage
  );
  // login
  router.get(
    "/login",
    loginController.checkLoggedOut,
    loginController.getLoginPage
  );
  router.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/login",
      successFlash: true,
      failureFlash: true,
    })
  );
  // register
  router.get(
    "/register",
    loginController.checkLoggedOut,
    registerController.getRegisterPage
  );
  router.post(
    "/register",
    auth.validateRegister,
    registerController.createNewUser
  );
  // edit user info
  router.get("/userinfo", (req, res) => {
    const user = req.user;
    const role = user.ROLE;
    const userTable =
      role === "E" ? "ESTIMATOR" : role === "A" ? "ADMINISTRATOR" : "SUBMITTER";
    const userId = [user.ID];
    var sql = `SELECT * FROM ${userTable} WHERE ID = ?`;
    connection.query(sql, userId, function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else res.render("userinfo.ejs", { user: rows });
    });
  });

  router.post(
    "/userinfo",
    auth.validateRegister,
    editinfoController.updateUser
  );

  router.get("/generatetask", function (req, res) {
    res.render("generatetask.ejs");
  });

  router.post("/generatetaskAf", function (req, res) {
    var body = req.body;
    var sql = "INSERT INTO TASK VALUES(?, ?, ?, ?, ?)";
    var params = [
      body.name,
      body.description,
      body.taskdatatable,
      body.cycle,
      body.role,
    ];
    connection.query(sql, params, function (err) {
      if (err) {
        console.log("query is not executed. insert fail...\n" + err);
        res.redirect("/generatetask");
      } else {
        console.log("success1");
        if (body.role === "R") {
          var sql2 =
            "CREATE TABLE " +
            body.taskdatatable +
            "(PNUM VARCHAR(11) NOT NULL, ADDRESS ENUM('강남', '서초', '용산', '마포', '서대문') NOT NULL, VDATE DATE NOT NULL, VTIME TIME NOT NULL, SID VARCHAR(30) NOT NULL, PRIMARY KEY(PNUM), FOREIGN KEY(SID) REFERENCES SUBMITTER(ID))";
        } else {
          var sql2 =
            "CREATE TABLE " +
            body.taskdatatable +
            "(PNUM VARCHAR(11) NOT NULL, ADDRESS ENUM('강남', '서초', '용산', '마포', '서대문') NOT NULL, VDATE DATE NOT NULL, PN VARCHAR(1) NOT NULL, SID VARCHAR(30) NOT NULL, PRIMARY KEY(PNUM), FOREIGN KEY(SID) REFERENCES SUBMITTER(ID))";
        }
        connection.query(sql2, function (err) {
          if (err) {
            console.log("query is not executed. insert fail...\n" + err);
            var sql5 = "delete from TASK where NAME= " + body.name;
            connection.query(sql5, function (err) {});
            res.redirect("/generatetask");
          } else {
            console.log("Success2");
            var sql3 =
              "INSERT INTO TYPEORIGIN(SCHEMA1, SCHEMA2, SCHEMA3, SCHEMA4, SCHEMA5, SCHEMA6, SCHEMA7, SCHEMA8, SCHEMA9, SCHEMA10, CPNUM, CADDRESS, CVDATE, CEXTRA, SCHEMANUM) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            if(body.role==="R"){
              var params3 = [
                'PNUM',
                'ADDRESS',
                'VDATE',
                'VTIME',
                body.schema5,
                body.schema6,
                body.schema7,
                body.schema8,
                body.schema9,
                body.schema10,
                0,
                1,
                2,
                3,
                body.numschema,
              ];
            }
            else{
              var params3 = [
                'PNUM',
                'ADDRESS',
                'VDATE',
                'PN',
                body.schema5,
                body.schema6,
                body.schema7,
                body.schema8,
                body.schema9,
                body.schema10,
                0,
                1,
                2,
                3,
                body.numschema,
              ];
            }
            connection.query(sql3, params3, function (err) {
              if (err) {
                console.log("query is not executed. insert fail...\n" + err);
                var sql4 = "delete from TASK where NAME= " + body.name;
                connection.query(sql4, function (err) {
                  var sql6 = "DROP TABLE " + body.taskdatatable;
                  connection.query(sql6, function (err) {});
                });
                res.redirect("/generatetask");
              } else {
                console.log("Success3");
                res.redirect("/generatetask");
              }
            });
          }
        });
      }
    });
  });

  // deny request of submitter
  router.get("/deny_request", function (req, res) {
    connection.query(
      "delete from REQUEST LIMIT 1",
      function (err, row, fields) {
        if (err) console.log("query is not executed. select fail...\n" + err);
        else {
          res.redirect("/request");
        }
      }
    );
  });

  router.get("/apply_request", function (req, res) {
    connection.query("SELECT * FROM REQUEST", function (err, row, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(
          "insert into APPROVAL VALUE (?,?,?)",
          [row[0].TASKNAME, row[0].SUBMITTERID, row[0].ROLE],
          function (err, row, fields) {
            if (err)
              console.log("query is not executed. select fail...\n" + err);
            else {
              connection.query(
                "delete from request LIMIT 1",
                function (err, row, fields) {
                  if (err)
                    console.log(
                      "query is not executed. select fail...\n" + err
                    );
                  else {
                    res.redirect("/request");
                  }
                }
              );
            }
          }
        );
      }
    });
  });
  router.get("/request", function (req, res) {
    var sql = "SELECT * FROM REQUEST";
    connection.query(sql, function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else res.render("request.ejs", { REQUEST: rows });
    });
  });
  router.get("/approval", function (req, res) {
    var sql = "SELECT * FROM APPROVAL";
    connection.query(sql, function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else res.render("approval.ejs", { APPROVAL: rows });
    });
  });

  // Submitter request possible task list
  router.get("/submitter/notparticipate", function (req, res) {
    req.session.surl = {
      revisit_confirm: [false],
      task_request: "",
      task_submit: "",
      file_erase: "",
      submit_error: [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ],
    };

    var submit_id = req.user.ID;
    var submitter_tasknotquery = `SELECT TASK.NAME FROM TASK WHERE TASK.NAME `;
    var submitter_tasknotquery =
      submitter_tasknotquery +
      `NOT IN (SELECT REQUEST.TASKNAME FROM REQUEST WHERE REQUEST.SUBMITTERID = '${submit_id}')`;
    var submitter_tasknotquery =
      submitter_tasknotquery +
      ` AND TASK.NAME NOT IN (SELECT TASK.NAME FROM SUBMITTER, TASK WHERE SUBMITTER.ID= '${submit_id}' AND SUBMITTER.ROLE != TASK.ROLE)`;
    var submitter_tasknotquery =
      submitter_tasknotquery +
      ` AND TASK.NAME NOT IN (SELECT APPROVAL.TASKNAME FROM APPROVAL WHERE APPROVAL.SUBMITTERID = '${submit_id}');`;
    connection.query(submitter_tasknotquery, function (err, row2, fields) {
      if (err) {
        console.log("Something is wrong... Need coffee...\n" + err);
        console.log(err);
        res.render("error_SQL.ejs");
      } else {
        var handout = row2;
        res.render("submitter_notparticipate.ejs", { list: handout });
      }
    });
  });

  // Submitter submit possible task list
  router.get("/submitter/participate", function (req, res) {
    // Check if user is submitter or not
    req.session.surl = {
      revisit_confirm: [false],
      task_request: "",
      task_submit: "",
      file_erase: "",
      submit_error: [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ],
    };

    // There is such submitter
    // Find list of task that submitter can submit
    var submit_id = req.user.ID;
    var submitter_tasknotquery = `SELECT TASK.NAME FROM TASK WHERE TASK.NAME `;
    var submitter_tasknotquery =
      submitter_tasknotquery +
      `IN (SELECT APPROVAL.TASKNAME FROM APPROVAL WHERE APPROVAL.SUBMITTERID = '${submit_id}')`;
    connection.query(submitter_tasknotquery, function (err, row2, fields) {
      if (err) {
        console.log("Something is wrong... Need coffee...\n" + err);
        console.log(err);
        res.render("error_SQL.ejs");
      } else {
        var handout = row2;
        res.render("submitter_participate.ejs", { list: handout });
      }
    });
  });

  //
  router.get("/submitter/privacy_consent", function (req, res) {
    // Check Bad Access
    if (req.session.surl.task_request == "") {
      res.render("error_BadAccessWay.ejs");
    } else {
      //
      var handout = req.session.surl.revisit_confirm;
      res.render("submitter_privacy_consent.ejs", {
        list: handout,
        task: req.session.surl.task_request,
      });
    }
  });

  router.post("/submitter/privacy_consent", function (req, res) {
    if (!req.session.surl.revisit_confirm[0]) {
      if (req.body.taskname_request === undefined) {
        res.render("error_BadAccessWay.ejs");
      } else {
        //
        req.session.surl.task_request = req.body.taskname_request;
        var handout = req.session.surl.revisit_confirm;
        res.render("submitter_privacy_consent.ejs", {
          list: handout,
          task: req.session.surl.task_request,
        });
      }
    } else {
      var handout = req.session.surl.revisit_confirm;
      req.session.surl.task_request = req.body.taskname_request;
      res.render("submitter_privacy_consent.ejs", {
        list: handout,
        task: req.session.surl.task_request,
      });
    }
  });

  app.get("/submitter/privacy_confirm", function (req, res) {
    res.render("error_BadAccessWay.ejs");
  });

  app.post("/submitter/privacy_confirm", function (req, res) {
    //Check Bad Access
    var submit_id = req.user.ID;
    var submit_role = req.user.ROLE;
    if (req.session.surl.task_request == "") {
      res.render("error_BadAccessWay.ejs");
    } else {
      if (req.body.consent == "yes") {
        req.session.surl.revisit_confirm = [false];
        var submitter_request = `INSERT INTO REQUEST VALUE('${req.session.surl.task_request}', '${submit_id}', '${submit_role}');`;
        connection.query(submitter_request, function (err, row, fields) {
          if (err) {
            console.log("Something is wrong... Need coffee...\n" + err);
            console.log(err);
            res.render("error_SQL.ejs");
          } else {
            req.session.surl.task_request = "";
            res.render("submitter_privacy_confirm.ejs");
          }
        });
      } else if (req.body.consent == "no") {
        req.session.surl.revisit_confirm = [true];
        res.redirect("/submitter/privacy_consent");
      }
    }
  });

  router.get("/submitter/data_submit", function (req, res) {
    var handout = req.session.surl.submit_error;
    res.render("submitter_data_submit.ejs", {
      list: handout,
      task: req.session.surl.task_submit,
    });  
  });

  router.post("/submitter/data_submit", function (req, res) {
    req.session.surl.submit_error[0] = false;
    var handout = req.session.surl.submit_error;
    req.session.surl.task_submit = req.body.taskname_submit;
    res.render("submitter_data_submit.ejs", {
      list: handout,
      task: req.body.taskname_submit,
    });
  });

  // New
  router.get("/submitter/get_example_csv", function(req, res){
    res.render("submitter_get_example_csv.ejs");
  });

  // New
  router.get("/submitter/download_example_csv", function(req, res){
    var teamid = req.query.tmid;
    var role = req.query.role;
    if (role == "H"){
      var filename = role + "_team_" + teamid +  "_201202_201202" + ".csv"
    }
    else if (role == "R"){
      var filename = role + "_team_" + teamid +  "_201201_201201" + ".csv"
    }
    var exfilePath = path.join(
      __dirname,
      "/../../data/test_example_csv/" + filename
    );
    
    var filename_csv = path.basename(exfilePath);
    var mimetype_csv = mime.getType(exfilePath);
    res.setHeader('Content-disposition', 'attachment; filename=' + filename_csv);
    res.setHeader('Content-type', mimetype_csv);

    var filestream_csv = fs.createReadStream(exfilePath);
    filestream_csv.pipe(res);
  });


  router.get("/submitter/data_parse", function (req, res) {
    res.render("error_BadAccessWay.ejs");
  });

  router.post(
    "/submitter/data_parse",
    uploadmodule.upload.single("csvfile"),
    function (req, res) {
      var no_csv = false;
      var no_typeid = false;
      var no_startdate = false;
      var no_enddate = false;
      var no_round = false;

      var invalid_typeid = false; // Not Number
      var nosuch_typeid = false; // No such data type id (DB)
      var invalid_date_inverse = false; // end date is faster than start date
      var invalid_date_future = false; // end date is future than today
      var invalid_csv = false; // File is not .csv file

      var invalid_round = false;

      var permit_submit_temp = true; // Not Number

      var submit_id = req.user.ID;
      var submit_role = req.user.ROLE;

      if (req.file === undefined) {
        no_csv = true;
      }
      if (!no_csv) {
        if (req.file.originalname.slice(-4) != ".csv") {
          invalid_csv = true;
        }
      }
      if (req.body.startdate == "") {
        no_startdate = true;
      }
      if (req.body.enddate == "") {
        no_enddate = true;
      }
      if (!no_startdate && !no_enddate) {
        var stdate = new Date(req.body.startdate);
        var edate = new Date(req.body.enddate);
        var todaydate = new Date();
        todaydate.setDate(todaydate.getDate() + 1);

        if (stdate > edate) {
          invalid_date_inverse = true;
        }
        if (edate > todaydate) {
          invalid_date_future = true;
        }
      }
      if (req.body.typeid == "") {
        no_typeid = true;
      }
      if (!no_typeid) {
        invalid_typeid = !submitcsvmodule.check_numeric(req.body.typeid);
      }

      if (req.body.round == "") {
        no_round = true;
      }
      if (!no_round) {
        invalid_round = !submitcsvmodule.check_numeric(req.body.round);
      }

      if (
        no_csv ||
        no_typeid ||
        no_startdate ||
        no_enddate ||
        no_round ||
        invalid_round ||
        invalid_typeid ||
        invalid_date_inverse ||
        invalid_date_future ||
        invalid_csv
      ) {
        permit_submit_temp = false;
      } else {
        permit_submit_temp = true;
      }

      if (permit_submit_temp) {
        var search_typeid = `SELECT * FROM TYPEORIGIN WHERE ID = ${Number(
          req.body.typeid
        )};`;
        connection.query(search_typeid, function (err, row1, fields) {
          if (err) {
            console.log("Something is wrong... Need coffee...\n");
            console.log(err);
            res.render("error_SQL.ejs");
          } else if (row1.length == 1) {
            var search_round = `SELECT COUNT(*) AS RNUM FROM ${submit_role}PARSING WHERE TASKNAME = '${req.session.surl.task_submit}' AND SID = '${submit_id}';`;
            connection.query(search_round, function (err, row2, fields) {
              if (err) {
                console.log("Something is wrong... Need coffee...\n");
                console.log(err);
                res.render("error_SQL.ejs");
              } else {
                var search_estimator = "SELECT * FROM ESTIMATOR;";
                connection.query(
                  search_estimator,
                  function (err, row3, fields) {
                    if (err) {
                      console.log("Something is wrong... Need coffee...\n");
                      console.log(err);
                      res.render("error_SQL.ejs");
                    } else {
                      var search_idnum = `SELECT MAX(PARSINGID) AS IDNUM FROM ${submit_role}PARSING;`;
                      connection.query(
                        search_idnum,
                        function (err, row4, fields) {
                          if (err) {
                            console.log(
                              "Something is wrong... Need coffee...\n"
                            );
                            console.log(err);
                            res.render("error_SQL.ejs");
                          } else {
                            // Start parsing
                            fs.readFile(
                              req.file.path,
                              { encoding: "utf-8" },
                              function (err1, csvData) {
                                var csv_rows = csvData.split("\n");
                                var est_id =
                                  row3[Math.floor(Math.random() * row3.length)]
                                    .ID;
                                var parsed = submitcsvmodule.csv_parsing(
                                  connection,
                                  csv_rows,
                                  submit_role,
                                  row1[0],
                                  row4[0].IDNUM,
                                  req.session.surl.task_submit,
                                  submit_id,
                                  req.body.typeid,
                                  row2[0].RNUM,
                                  req.body.startdate,
                                  req.body.enddate,
                                  est_id
                                );

                                //console.log(parsed[0], "A");
                                if (submit_role == "H") {
                                  fs.writeFile(
                                    __dirname.slice(0, -11) +
                                      "/data/parsed_csv_hospital/" +
                                      parsed[1] +
                                      ".csv",
                                      '\uFEFF' + parsed[0],
                                    { encoding: "utf-8" },
                                    function (err, data) {
                                      res.redirect("/submitter/success");
                                    }
                                  );
                                } else {
                                  fs.writeFile(
                                    __dirname.slice(0, -11) +
                                      "/data/parsed_csv_restaurant/" +
                                      parsed[1] +
                                      ".csv",
                                      '\uFEFF' + parsed[0],
                                    { encoding: "utf-8" },
                                    function (err, data) {
                                      res.redirect("/submitter/success");
                                    }
                                  );
                                }
                              }
                            );
                          }
                        }
                      );
                    }
                  }
                );
              }
            });
          } else {
            nosuch_typeid = true;
            req.session.surl.submit_error = [
              true,
              no_csv,
              no_typeid,
              no_startdate,
              no_enddate,
              no_round,
              invalid_typeid,
              nosuch_typeid,
              invalid_date_inverse,
              invalid_date_future,
              invalid_csv,
              invalid_round,
            ];
            req.session.surl.file_erase = req.file.path;
            res.redirect("/submitter/fail");
          }
        });
      } else {
        req.session.surl.submit_error = [
          true,
          no_csv,
          no_typeid,
          no_startdate,
          no_enddate,
          no_round,
          invalid_typeid,
          nosuch_typeid,
          invalid_date_inverse,
          invalid_date_future,
          invalid_csv,
          invalid_round,
        ];
        if (no_csv) {
          res.redirect("/submitter/data_submit");
        } else {
          req.session.surl.file_erase = req.file.path;
          res.redirect("/submitter/fail");
        }
      }
    }
  );

  router.get("/submitter/success", function (req, res) {
    req.session.surl.task_submit = "";
    req.session.surl.submit_error = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
    res.render("submitter_data_success.ejs");
  });

  router.get("/submitter/fail", function (req, res) {
    if (req.session.surl.file_erase == "") {
      res.render("error_BadAccessWay.ejs");
    } else {
      fs.unlink(req.session.surl.file_erase, function (err) {
        if (err) {
          console.log(err);
        } else {
          req.session.surl.file_erase = "";
          res.redirect("/submitter/data_submit");
        }
      });
    }
  });

  // check informations about submit file
  router.get("/mypage", function (req, res) {
    res.render("mypage.ejs");
  });

  router.get("/userinfo", (req, res) => {
    const user = req.user;
    const role = user.ROLE;
    const userTable =
      role === "E" ? "ESTIMATOR" : role === "A" ? "ADMINISTRATOR" : "SUBMITTER";
    const userId = [user.ID];
    var sql = `SELECT * FROM ${userTable} WHERE ID = ?`;
    connection.query(sql, userId, function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else res.render("userinfo.ejs", { user: rows });
    });
  });

  // number of files user submitted
  router.get("/num_files", function (req, res) {
    const user = req.user;
    const role = user.ROLE;
    const parsingTable = role === "R" ? "RPARSING" : "HPARSING";
    const userId = [user.ID];
    const sql = `SELECT COUNT(*) AS CNT,TASKNAME FROM ${parsingTable} WHERE SID = ? GROUP BY TASKNAME`;
    connection.query(sql, userId, function (err, rows) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else res.render("num_files.ejs", { data: rows });
    });
  });

  // number of tuples in files user submitted
  router.get("/num_tuples", function (req, res) {
    const user = req.user;
    const role = user.ROLE;
    const parsingTable = role === "R" ? "RPARSING" : "HPARSING";
    const userId = [user.ID];
    const sql = `SELECT SUM(totaltuple) as S,TASKNAME FROM ${parsingTable} WHERE ESTATE = "Y" AND SID = ? GROUP BY TASKNAME`;
    connection.query(sql, userId, function (err, rows) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else res.render("num_tuples.ejs", { data: rows });
    });
  });

  // information about files
  router.get("/file_info", function (req, res) {
    const user = req.user;
    const role = user.ROLE;
    const parsingTable = role === "R" ? "RPARSING" : "HPARSING";
    const userId = [user.ID];
    const sql = `SELECT TASKNAME,PARSINGID,ROUND,ESTATE,ESCORE,PASS,SID,TID FROM ${parsingTable} WHERE SID = ? ORDER BY ROUND ASC`;
    connection.query(sql, userId, function (err, rows) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else res.render("file_info.ejs", { data: rows });
    });
  });

  // estimate
  router.get(
    "/estimatormain",
    loginController.checkLoggedIn,
    estimatingController.getREstimatorPage
  );
  router.get(
    "/estimatormain2",
    loginController.checkLoggedIn,
    estimatingController.getHEstimatorPage
  );
  router.get(
    "/notestimated",
    loginController.checkLoggedIn,
    estimatingController.getRNotEstimatingPage
  );
  router.get(
    "/notestimated2",
    loginController.checkLoggedIn,
    estimatingController.getHNotEstimatingPage
  );
  router.get("/restimating", function (req, res) {
    var sql = "SELECT * FROM RPARSING WHERE ESTATE='N' AND EID=?";
    connection.query(sql, [req.user.ID], function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        if (rows.length < 1) {
          res.render("restimating.ejs", { rparsed: rows });
        } else {
          res.render("restimating.ejs", { rparsed: rows });
        }
      }
    });
  });
  // restaurant estimating -> if p, save data in tdt table
  router.post("/restimatingAf", function (req, res) {
    var body = req.body;
    var sql =
      "UPDATE RPARSING SET ESTATE='Y', ESCORE=?, PASS=? WHERE EID=? AND PARSINGID=?";
    var sql2 = "SELECT * FROM RPARSING WHERE ESTATE='N' AND EID=?";
    var pid;
    var task;
    var sid;
    var nameOfTask;
    connection.query(sql2, [req.user.ID], function (err, rows) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        pid = rows[0].PARSINGID;
        task = rows[0].TASKNAME; //task = "밤치킨식당 태스크"
        sid = rows[0].SID;
        connection.query(
          "SELECT * FROM TASK WHERE NAME=?",
          [task],
          function (err, rows) {
            if (err)
              console.log("query is not executed. select fail...\n" + err);
            else {
              nameOfTask = rows[0].TASKDATATABLE; // taskName = "TDT_nightchicken"
              if (body.pass === "P") {
                var filePath = path.join(
                  __dirname,
                  "/../../data/parsed_csv_restaurant/" + pid + ".csv"
                );
                if (!fs.existsSync(filePath)) {
                  res.send("테이블에 넣을 파일이 존재하지 않습니다.");
                } else {
                  var data = fs.readFileSync(filePath, { encoding: "utf8" });
                  var rowData = data.slice(1).split("\n");
                  var result = [];
                  for (var i = 0; i < rowData.length; i++) {
                    var row = rowData[i].split(",");
                    var datas = [];
                    for (var j = 0; j < row.length; j++) {
                      datas[j] = row[j];
                    }
                    result.push(datas);
                  }
                  for (var rowIndex in rowData) {
                    var sql3 =
                      "INSERT INTO " +
                      String(nameOfTask) +
                      " VALUES(?,?,?,?,?)";
                      console.log(result[rowIndex][0].length, "A");
                    connection.query(
                      sql3,
                      [
                        result[rowIndex][0],
                        result[rowIndex][1],
                        result[rowIndex][2],
                        result[rowIndex][3],
                        sid,
                      ],
                      function (err, rows) {
                        if (err)
                          console.log(
                            "query is not executed. insert fail...\n" + err
                          );
                      }
                    );
                  }
                  connection.query(
                    sql,
                    [body.score, body.pass, req.user.ID, pid],
                    function (err, rows, fields) {
                      if (err)
                        console.log(
                          "query is not executed. select fail...\n" + err
                        );
                      else {
                        res.redirect("/notestimated");
                      }
                    }
                  );
                }
              } else {
                connection.query(
                  sql,
                  [body.score, body.pass, req.user.ID, pid],
                  function (err, rows, fields) {
                    if (err)
                      console.log(
                        "query is not executed. select fail...\n" + err
                      );
                    else {
                      res.redirect("/notestimated");
                    }
                  }
                );
              }
            }
          }
        );
      }
    });
  });
  router.get("/hestimating", function (req, res) {
    var sql = "SELECT * FROM HPARSING WHERE ESTATE='N' AND EID=?";
    connection.query(sql, [req.user.ID], function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        if (rows.length < 1) {
          res.render("hestimating.ejs", { hparsed: rows });
        } else {
          res.render("hestimating.ejs", { hparsed: rows });
        }
      }
    });
  });
  router.post("/hestimatingAf", function (req, res) {
    var body = req.body;
    var sql =
      "UPDATE HPARSING SET ESTATE='Y', ESCORE=?, PASS=? WHERE EID=? AND PARSINGID=?";
    var sql2 = "SELECT * FROM HPARSING WHERE ESTATE='N' AND EID=?";
    var pid;
    var task;
    var sid;
    var nameOfTask;
    connection.query(sql2, [req.user.ID], function (err, rows) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        pid = rows[0].PARSINGID;
        task = rows[0].TASKNAME;
        sid = rows[0].SID;
        connection.query(
          "SELECT * FROM TASK WHERE NAME=?",
          [task],
          function (err, rows) {
            if (err)
              console.log("query is not executed. select fail...\n" + err);
            else {
              nameOfTask = rows[0].TASKDATATABLE;
              if (body.pass === "P") {
                var filePath = path.join(
                  __dirname,
                  "/../../data/parsed_csv_hospital/" + pid + ".csv"
                );
                if (!fs.existsSync(filePath)) {
                  res.send("테이블에 넣을 파일이 존재하지 않습니다.");
                } else {
                  var data = fs.readFileSync(filePath, { encoding: "utf8" });
                  var rowData = data.slice(1).split("\n");
                  var result = [];
                  for (var i = 0; i < rowData.length; i++) {
                    var row = rowData[i].split(",");
                    var datas = [];
                    for (var j = 0; j < row.length; j++) {
                      datas[j] = row[j];
                    }
                    result.push(datas);
                  }
                  for (var rowIndex in rowData) {
                    var sql3 =
                      "INSERT INTO " +
                      String(nameOfTask) +
                      " VALUES(?,?,?,?,?)";
                      
                    connection.query(
                      sql3,
                      [
                        result[rowIndex][0],
                        result[rowIndex][1],
                        result[rowIndex][2],
                        result[rowIndex][3],
                        sid,
                      ],
                      function (err, rows) {
                        if (err)
                          console.log(
                            "query is not executed. insert fail...\n" + err
                          );
                      }
                    );
                  }
                  connection.query(
                    sql,
                    [body.score, body.pass, req.user.ID, pid],
                    function (err, rows, fields) {
                      if (err)
                        console.log(
                          "query is not executed. select fail...\n" + err
                        );
                      else {
                        res.redirect("/notestimated2");
                      }
                    }
                  );
                }
              } else {
                connection.query(
                  sql,
                  [body.score, body.pass, req.user.ID, pid],
                  function (err, rows, fields) {
                    if (err)
                      console.log(
                        "query is not executed. select fail...\n" + err
                      );
                    else {
                      res.redirect("/notestimated2");
                    }
                  }
                );
              }
            }
          }
        );
      }
    });
  });
  // csv파일을 받기위함
  router.get("/downRparsed", function (req, res, next) {
    connection.query(
      "SELECT * FROM RPARSING WHERE ESTATE='N' AND EID=?",
      [req.user.ID],
      function (err, rows) {
        if (err) console.log("query is not executed. select fail...\n" + err);
        else {
          var pid = rows[0].PARSINGID;
          var file =
            __dirname + "/../../data/parsed_csv_restaurant/" + pid + ".csv";
          try {
            if (fs.existsSync(file)) {
              // 파일이 존재하는지 체크
              var filename = path.basename(file); // 파일 경로에서 파일명(확장자포함)만 추출
              var mimetype = mime.getType(file); // 파일의 타입(형식)을 가져옴

              res.setHeader(
                "Content-disposition",
                "attachment; filename=" + filename
              ); // 다운받아질 파일명 설정
              res.setHeader("Content-type", mimetype); // 파일 형식 지정

              var filestream = fs.createReadStream(file);
              filestream.pipe(res);
            } else {
              res.send("해당 파일이 없습니다.");
              return;
            }
          } catch (e) {
            // 에러 발생시
            console.log(e);
            res.send("파일을 다운로드하는 중에 에러가 발생하였습니다.");
            return;
          }
        }
      }
    );
  });
  router.get("/downHparsed", function (req, res, next) {
    connection.query(
      "SELECT * FROM HPARSING WHERE ESTATE='N' AND EID=?",
      [req.user.ID],
      function (err, rows) {
        if (err) console.log("query is not executed. select fail...\n" + err);
        else {
          var pid = rows[0].PARSINGID;
          var file =
            __dirname + "/../../data/parsed_csv_hospital/" + pid + ".csv";
          console.log(__dirname);
          console.log(file);
          try {
            if (fs.existsSync(file)) {
              var filename = path.basename(file);
              var mimetype = mime.getType(file);

              res.setHeader(
                "Content-disposition",
                "attachment; filename=" + filename
              );
              res.setHeader("Content-type", mimetype); // 파일 형식 지정

              var filestream = fs.createReadStream(file);
              filestream.pipe(res);
            } else {
              res.send("해당 파일이 없습니다.");
              return;
            }
          } catch (e) {
            console.log(e);
            res.send("파일을 다운로드하는 중에 에러가 발생하였습니다.");
            return;
          }
        }
      }
    );
  });

  // All the list of users for administrator
  router.get("/allUsers", function (req, res) {
    var sql = "SELECT * FROM SUBMITTER";
    var sql2 = "SELECT * FROM ESTIMATOR";
    connection.query(sql, function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(sql2, function (err, results, fields) {
          if (err) console.log("query is not executed. select fail...\n" + err);
          else {
            res.render("allUsers.ejs", { submitter: rows, estimator: results });
          }
        });
      }
    });
  });

  router.get("/searchByRole", (req, res) => {
    var role = req.query.role;
    var sql = "SELECT * FROM SUBMITTER WHERE ROLE= ?";
    var sql2 = "SELECT * FROM ESTIMATOR WHERE ROLE= ?";

    connection.query(sql, [role[0]], function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(sql2, [role[0]], function (err, results, fields) {
          if (err) console.log("query is not executed. select fail...\n" + err);
          else {
            res.render("search.ejs", { submitter: rows, estimator: results });
          }
        });
      }
    });
  });

  router.get("/searchByAge", (req, res) => {
    var role = req.query.age;
    var sql = "SELECT * FROM SUBMITTER WHERE AGE= ?";
    var sql2 = "SELECT * FROM ESTIMATOR WHERE AGE= ?";

    connection.query(sql, [role[0]], function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(sql2, [role[0]], function (err, results, fields) {
          if (err) console.log("query is not executed. select fail...\n" + err);
          else {
            res.render("search.ejs", { submitter: rows, estimator: results });
          }
        });
      }
    });
  });

  router.get("/searchByGender", (req, res) => {
    var role = req.query.Gender;
    var sql = "SELECT * FROM SUBMITTER WHERE GENDER= ?";
    var sql2 = "SELECT * FROM ESTIMATOR WHERE GENDER= ?";

    connection.query(sql, [role[0]], function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(sql2, [role[0]], function (err, results, fields) {
          if (err) console.log("query is not executed. select fail...\n" + err);
          else {
            res.render("search.ejs", { submitter: rows, estimator: results });
          }
        });
      }
    });
  });

  router.get("/searchByTask", (req, res) => {
    var role = req.query.Task;
    var sql0 = "SELECT SUBMITTERID FROM APPROVAL WHERE TASKNAME= ?";
    var sql1 = "SELECT * FROM SUBMITTER WHERE ID= ?";
    var sql2 = "SELECT * FROM ESTIMATOR WHERE ID= ?";

    connection.query(sql0, [role[0]], function (err, row, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(
          sql1,
          [row[0].submitterid],
          function (err, restaurant, fields) {
            if (err)
              console.log("query is not executed. select fail...\n" + err);
            else {
              connection.query(
                sql2,
                [row[0].submitterid],
                function (err, hospital, fields) {
                  if (err)
                    console.log(
                      "query is not executed. select fail...\n" + err
                    );
                  else {
                    res.render("search.ejs", {
                      submitter: restaurant,
                      estimator: hospital,
                    });
                  }
                }
              );
            }
          }
        );
      }
    });
  });

  router.get("/searchByID", (req, res) => {
    var role = req.query.ID;
    var sql = "SELECT * FROM SUBMITTER WHERE ID= ?";
    var sql2 = "SELECT * FROM ESTIMATOR WHERE ID= ?";

    connection.query(sql, [role[0]], function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(sql2, [role[0]], function (err, results, fields) {
          if (err) console.log("query is not executed. select fail...\n" + err);
          else {
            res.render("search.ejs", { submitter: rows, estimator: results });
          }
        });
      }
    });
  });

  app.get("/move", function (req, res) {
    var sid = req.query.id;
    var sql1 =
      "SELECT distinct TASKNAME FROM RPARSING where SID = ?";
    var sql2 =
      "SELECT distinct TASKNAME FROM HPARSING where SID = ?";
    connection.query(sql1, [sid], function (err, result1, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(sql2, [sid], function (err, result2, fields) {
          if (err) console.log("query is not executed. select fail...\n" + err);
          else {
            res.render("move.ejs", { r: result1, h: result2 });
          }
        });
      }
    });
  });

  app.get("/submitterPerTask", function (req, res) {
    var sql =
      "select TASKNAME, GROUP_CONCAT(distinct SID) as SUBMITTER from RPARSING group by TASKNAME";
    var sql2 =
      "select TASKNAME, GROUP_CONCAT(distinct SID) as SUBMITTER from HPARSING group by TASKNAME";
    var sql3 = "select distinct SID as SUBMITTER from RPARSING";
    var sql4 = "select distinct SID as SUBMITTER from HPARSING";
    connection.query(sql, function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(sql2, function (err, result, fields) {
          if (err) console.log("query is not executed. select fail...\n" + err);
          else {
            connection.query(sql3, function (err, add1, fields) {
              if (err)
                console.log("query is not executed. select fail...\n" + err);
              else {
                connection.query(sql4, function (err, add2, fields) {
                  if (err)
                    console.log(
                      "query is not executed. select fail...\n" + err
                    );
                  else {
                    res.render("submitterPerTask.ejs", {
                      list: rows,
                      list2: result,
                      sub1: add1,
                      sub2: add2,
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  app.get("/taskStats", function (req, res) {
    var sql =
      "SELECT TASKNAME, COUNT(TASKNAME) AS NUM FROM RPARSING GROUP BY TASKNAME";
    var sql2 =
      "SELECT E.TASKNAME, count(*) as CNT from (select TASKNAME, PASS from RPARSING) as E where E.PASS = 'P' group by E.TASKNAME";
    var sql3 =
      "SELECT TASKNAME, COUNT(TASKNAME) AS NUM FROM HPARSING GROUP BY TASKNAME";
    var sql4 =
      "SELECT E.TASKNAME, count(*) as CNT from (select TASKNAME, PASS from HPARSING) as E where E.PASS = 'P' group by E.TASKNAME";
    var sql5 = "SELECT TASKNAME,TID FROM RPARSING GROUP BY TASKNAME,TID";
    var sql6 =
      "SELECT TASKNAME,TID FROM RPARSING where PASS= 'P' GROUP BY TASKNAME,TID";
    var sql7 = "SELECT TASKNAME,TID FROM HPARSING GROUP BY TASKNAME,TID";
    var sql8 =
      "SELECT TASKNAME,TID FROM HPARSING where PASS= 'P' GROUP BY TASKNAME,TID";
    connection.query(sql, function (err, rst1, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(sql2, function (err, rst2, fields) {
          if (err) console.log("query is not executed. select fail...\n" + err);
          else {
            connection.query(sql3, function (err, hos1, fields) {
              if (err)
                console.log("query is not executed. select fail...\n" + err);
              else {
                connection.query(sql4, function (err, hos2, fields) {
                  if (err)
                    console.log(
                      "query is not executed. select fail...\n" + err
                    );
                  else {
                    connection.query(sql5, function (err, t1, fields) {
                      if (err)
                        console.log(
                          "query is not executed. select fail...\n" + err
                        );
                      else {
                        connection.query(sql6, function (err, t2, fields) {
                          if (err)
                            console.log(
                              "query is not executed. select fail...\n" + err
                            );
                          else {
                            connection.query(sql7, function (err, t3, fields) {
                              if (err)
                                console.log(
                                  "query is not executed. select fail...\n" +
                                    err
                                );
                              else {
                                connection.query(
                                  sql8,
                                  function (err, t4, fields) {
                                    if (err)
                                      console.log(
                                        "query is not executed. select fail...\n" +
                                          err
                                      );
                                    else {
                                      res.render("taskStats.ejs", {
                                        rstats: rst1,
                                        rest: rst2,
                                        hstats: hos1,
                                        hos: hos2,
                                        rtype: t1,
                                        rtype2: t2,
                                        htype: t3,
                                        htype2: t4,
                                      });
                                    }
                                  }
                                );
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  app.get("/searchSubmitter", function (req, res) {
    var sid = req.query.id;
    var sql1 =
      "SELECT TASKNAME, PARSINGID, count(TASKNAME) as NUM from RPARSING where SID=? group by PARSINGID";
    var sql2 =
      "SELECT TASKNAME, PARSINGID, count(TASKNAME) as NUM from HPARSING where SID=? group by PARSINGID";
    var sql3 =
      "SELECT E.TASKNAME, count(*) as CNT, E.PARSINGID from (select TASKNAME, PASS, SID, PARSINGID from RPARSING) as E where E.PASS = 'P' and E.SID =?  group by E.PARSINGID";
    var sql4 =
      "SELECT E.TASKNAME, count(*) as CNT, E.PARSINGID from (select TASKNAME, PASS, SID, PARSINGID from HPARSING) as E where E.PASS = 'P' and E.SID =?  group by E.PARSINGID";
    connection.query(sql1, [sid], function (err, result1, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(sql2, [sid], function (err, result2, fields) {
          if (err) console.log("query is not executed. select fail...\n" + err);
          else {
            connection.query(sql3, [sid], function (err, result3, fields) {
              if (err)
                console.log("query is not executed. select fail...\n" + err);
              else {
                connection.query(sql4, [sid], function (err, result4, fields) {
                  if (err)
                    console.log(
                      "query is not executed. select fail...\n" + err
                    );
                  else {
                    res.render("searchSubmitter.ejs", {
                      rtask: result1,
                      htask: result2,
                      rstats: result3,
                      hstats: result4,
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  app.get("/searchEst", function (req, res) {
    var eid = req.query.id;
    var sql1 = "SELECT TASKNAME, PARSINGID from RPARSING where EID=?";
    var sql2 = "SELECT TASKNAME, PARSINGID from HPARSING where EID=?";
    connection.query(sql1, [eid], function (err, result1, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(sql2, [eid], function (err, result2, fields) {
          if (err) console.log("query is not executed. select fail...\n" + err);
          else {
            res.render("searchEst.ejs", { r: result1, h: result2 });
          }
        });
      }
    });
  });

  app.get("/download", function (req, res) {
    var sql1 = "select TASKNAME as NAME,TID from RPARSING where ESTATE = 'Y' and PASS = 'P'";
    var sql2 = "select TASKNAME as NAME,TID from HPARSING where ESTATE = 'Y' and PASS = 'P'";
    connection.query(sql1, function (err, result1, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        connection.query(sql2, function (err, result2, fields) {
          if (err) console.log("query is not executed. select fail...\n" + err);
          else {
            res.render("download.ejs", { r: result1, h: result2 });
          }
        });
      }
    });
  });


  app.get("/download_r", function (req, res) {
    var index = req.query.id.indexOf("?");
    var index2 = req.query.id.indexOf(":");

    var name = req.query.id.substr(0,index);
    var type = req.query.id.substr(index2+1, index3);

    var sql1 = "SELECT * FROM RPARSING WHERE ESTATE='Y' and PASS = 'P' and TASKNAME= ? and TID = ?";

    connection.query(sql1, [name, type], function (err, result1, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        var pid = result1[0].PARSINGID;
          var file =
            __dirname + "/../../data/parsed_csv_restaurant/" + pid + ".csv";
          try {
            if (fs.existsSync(file)) {
              // 파일이 존재하는지 체크
              var filename = path.basename(file); // 파일 경로에서 파일명(확장자포함)만 추출
              var mimetype = mime.getType(file); // 파일의 타입(형식)을 가져옴

              res.setHeader(
                "Content-disposition",
                "attachment; filename=" + filename
              ); // 다운받아질 파일명 설정
              res.setHeader("Content-type", mimetype); // 파일 형식 지정

              var filestream = fs.createReadStream(file);
              filestream.pipe(res);
            } else {
              res.send("해당 파일이 없습니다.");
              return;
            }
          } catch (e) {
            // 에러 발생시
            console.log(e);
            res.send("파일을 다운로드하는 중에 에러가 발생하였습니다.");
            return;
          }
      }
    });
  });

  app.get("/download_h", function (req, res) {
    var index = req.query.id.indexOf("?");
    var index2 = req.query.id.indexOf(":");

    var name = req.query.id.substr(0,index);
    var type = req.query.id.substr(index3+1);

    var sql1 = "SELECT * FROM HPARSING WHERE ESTATE='Y' and PASS = 'P' and TASKNAME= ? and TID = ?";

    connection.query(sql1, [name, type], function (err, result1, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else {
        var pid = result1[0].PARSINGID;
          var file =
            __dirname + "/../../data/parsed_csv_hospital/" + pid + ".csv";
          try {
            if (fs.existsSync(file)) {
              // 파일이 존재하는지 체크
              var filename = path.basename(file); // 파일 경로에서 파일명(확장자포함)만 추출
              var mimetype = mime.getType(file); // 파일의 타입(형식)을 가져옴

              res.setHeader(
                "Content-disposition",
                "attachment; filename=" + filename
              ); // 다운받아질 파일명 설정
              res.setHeader("Content-type", mimetype); // 파일 형식 지정

              var filestream = fs.createReadStream(file);
              filestream.pipe(res);
            } else {
              res.send("해당 파일이 없습니다.");
              return;
            }
          } catch (e) {
            // 에러 발생시
            console.log(e);
            res.send("파일을 다운로드하는 중에 에러가 발생하였습니다.");
            return;
          }
      }
    });
  });



  // logout
  router.post("/logout", loginController.postLogOut);

  // disconnect user
  router.get("/disconnect", (req, res) => {
    const user = req.user;
    const role = user.ROLE;
    const userTable = role === "E" ? "ESTIMATOR" : "SUBMITTER";
    const userId = [user.ID];
    var sql = `SELECT * FROM ${userTable} WHERE ID = ?`;
    connection.query(sql, userId, function (err, rows, fields) {
      if (err) console.log("query is not executed. select fail...\n" + err);
      else
        res.render("disconnect.ejs", {
          user: rows,
          errors: req.flash("errors"),
        });
    });
  });

  router.post("/disconnect", disconnectController.deleteUser);

  return app.use("/", router);
};

module.exports = initWebRoutes;
