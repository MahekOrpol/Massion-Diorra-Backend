const config = require("../config/config");
const moment = require('moment');
const fs = require('fs');



const saveFile = (files) => {
    let fileUploadPath = config.fileUploadPath + '/images/';
    const fileName = moment().unix() + Math.floor(1000 + Math.random() * 9000) + '.' + files.name.split('.').pop();;
    return new Promise(async (resolve, reject) => {
        fileUploadPath = fileUploadPath + fileName;
        files.mv(fileUploadPath, async (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    upload_path: '/images/' + fileName,
                    file_name: fileName
                });
            }
        });
    })
}


const removeFile = (file_name) => {
    let fileUploadPath = config.fileUploadPath + file_name;
    return new Promise((resolve, reject) => {
        fs.unlink(fileUploadPath, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // File doesn't exist, log and resolve gracefully
                    console.warn("⚠️ File not found, skipping deletion:", fileUploadPath);
                    resolve(false);
                } else {
                    // Other errors, reject
                    console.error("❌ Error deleting file:", err);
                    reject(err);
                }
            } else {
                console.log("✅ File deleted:", fileUploadPath);
                resolve(true);
            }
        });
    });
};



module.exports = {
    saveFile,
    removeFile
}