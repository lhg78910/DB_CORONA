import connection from "../configs/connectDB";

function check_numeric(str){
    var ret = true;
    var numeric = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (i = 0; i<str.length; i++){
        if (!numeric.includes(str.charAt(i))){
            ret =  false;
        }
    }
    return ret;
}

function check_PNUM(str){
    var invalid_form = false;
    if (!check_numeric(str)){invalid_form = true;}
    if (str.length != 11){invalid_form = true;}
    return (!invalid_form);
}

function check_ADDRESS(str){
    var addresses = ['강남','서초','용산','마포','서대문'];
    return addresses.includes(str);
}

function check_PN(str){
    var pns = ['P', 'N'];
    return pns.includes(str);
}

function check_VDATE(str, startdate, enddate){

    var dates = [31,29,31,30,31,30,31,31,30,31,30,31]
    var invalid_form = false;
    var temp = str.split("-");
    if (temp.length != 3){invalid_form = true;}
    if ((!invalid_form) && (temp[0].length != 4)){invalid_form = true;}
    if ((!invalid_form) && (temp[1].length != 2)){invalid_form = true;}
    if ((!invalid_form) && (temp[2].length != 2)){invalid_form = true;}
    if ((!invalid_form) && (!check_numeric(temp[0]))){invalid_form = true;}
    if ((!invalid_form) && (!check_numeric(temp[1]))){invalid_form = true;}
    if ((!invalid_form) && (!check_numeric(temp[2]))){invalid_form = true;}
    if (!invalid_form){
        var t_year = Number(temp[0]);
        var t_month = Number(temp[1]);
        var t_date = Number(temp[2]);
        if ((t_year > 9999) || (t_year < 1000)){invalid_form = true;}
        else if ((t_month > 12) || (t_month < 1)){invalid_form = true;}
        else if ((t_date > dates[t_month - 1]) || (t_date < 1)){invalid_form = true;}
    }
    if (!invalid_form){
        if (str.localeCompare(startdate) == -1){invalid_form = true;}
        if (str.localeCompare(enddate) == 1){invalid_form = true;}
    }

    return (!invalid_form);
}

function check_VTIME(str){
    var invalid_form = false;
    var temp = str.split(":");
    if (temp.length != 3){invalid_form = true;}
    if ((!invalid_form) && (temp[0].length != 2)){invalid_form = true;}
    if ((!invalid_form) && (temp[1].length != 2)){invalid_form = true;}
    if ((!invalid_form) && (temp[2].length != 2)){invalid_form = true;}
    if ((!invalid_form) && (!check_numeric(temp[0]))){invalid_form = true;}
    if ((!invalid_form) && (!check_numeric(temp[1]))){invalid_form = true;}
    if ((!invalid_form) && (!check_numeric(temp[2]))){invalid_form = true;}
    if (!invalid_form){
        var t_hour = Number(temp[0]);
        var t_min = Number(temp[1]);
        var t_sec = Number(temp[2]);
        if ((t_hour > 23) || (t_hour <0)){invalid_form = true;}
        if ((t_min > 59) || (t_min < 0)){invalid_form = true;}
        if ((t_sec > 59) || (t_sec < 0)){invalid_form = true;}
    }
    return (!invalid_form);
}

function csv_parsing(connection, data, role, mapping, parsingid, taskname, sid, tid, round, termstart, termend, eid){
  var null_pnum;
  var null_address;
  var null_vdate;
  var null_extra;
  var parse_query;

  var row_nonull;
  var row_pass;

  var _pnum;
  var _address;
  var _vdate;
  var _extra;

  var row_total = 0;
  var row_good = 0;
  var null_total = 0;
  var null_count = 0;
  var dup_count = 0;
  var null_rate = 0;
  var pid = parsingid + 1;
  var roundid = round + 1;

  var newcsvTuple = [];
  var dupcheckArray = [];
  var newcsvData = "";
  for (var i = 1; i < data.length; i++){
    if (data[i].slice(-1) == "\r"){
      var csvRow = data[i].slice(0, -1).split(",");
    }
    else{
      var csvRow = data[i].split(",");
    }
    
    console.log(csvRow);

    null_count = 0;
    null_pnum = false;
    null_address = false;
    null_vdate = false;
    null_extra = false;

    row_nonull = false;
    row_pass = false;

    if(csvRow.length > mapping.CPNUM){
      _pnum = csvRow[mapping.CPNUM];
      if(!check_PNUM(_pnum)){null_pnum = true; console.log('A');}
    }
    else{null_pnum = true; console.log(mapping.CPNUM);}

    if(csvRow.length > mapping.CADDRESS){
      _address = csvRow[mapping.CADDRESS];
      if(!check_ADDRESS(_address)){null_address = true;}
    }
    else{null_address = true;}

    if(csvRow.length > mapping.CVDATE){ 
      _vdate = csvRow[mapping.CVDATE];
      if(!check_VDATE(_vdate, termstart, termend)){null_vdate = true;}
    }
    else{null_vdate = true;}

    if(csvRow.length > mapping.CEXTRA){
      _extra = csvRow[mapping.CEXTRA];
      if (role == "H"){
        if (!check_PN(_extra)){null_extra = true;}
      }
      else if (role == "R"){
        if (!check_VTIME(_extra)){null_extra = true;}
      }
    }
    else{null_extra = true;}

    if (null_pnum){null_count++;}
    if (null_address){null_count++;}
    if (null_vdate){null_count++;}
    if (null_extra){null_count++;}

    if (csvRow != ""){
      row_total++;
      if (null_count == 0){row_nonull = true;}
      null_total = null_total + null_count;

      if (row_nonull){
        if (dupcheckArray.includes(_pnum)){
          row_pass = false;
          dup_count++;
        }
        else{
          dupcheckArray.push(_pnum);
          row_pass = true;
        }
      }

      if (row_pass){
        var row_string = [_pnum, _address, _vdate, _extra].join(",");
        row_good++;
        newcsvTuple.push(row_string);
      }
    }

  }

  newcsvData = newcsvTuple.join("\n");
  null_rate = 100 * null_total / (4 * row_total);
  null_rate = null_rate.toFixed(1);

  parse_query = `INSERT INTO ${role}PARSING VALUE(${pid}, '${taskname}', '${sid}', ${tid}, ${roundid}, '${termstart}', '${termend}', '${eid}', ${row_good}, ${dup_count}, ${null_rate}, 'N', 0, 'N');`;
  connection.query(parse_query, function(err, row, fields){
    if (err){
      console.log(err);
    }
  });

  return [newcsvData, pid];
}

module.exports = {
    check_numeric: check_numeric,
    check_PNUM: check_PNUM,
    check_ADDRESS: check_ADDRESS,
    check_PN: check_PN,
    check_VDATE: check_VDATE,
    check_VTIME: check_VTIME,
    csv_parsing: csv_parsing,
};