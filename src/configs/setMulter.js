import multer from "multer";

//Multer
var upload_storage = multer.diskStorage({
    destination : function (req, file, cb){
        cb(null, __dirname.slice(0, -12)  + '/data/data_original_csv')
    },
    filename: function(req, file, cb){
        cb(null, make_random_str(20) + '_' + make_random_str(20) + '_' + make_random_str(20) + '.csv')
    }
});
var upload = multer({storage : upload_storage});

function make_random_str(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = {

    upload: upload,
    make_random_str: make_random_str,
};