var nodemailer = require('nodemailer');
var sesTransport = require('nodemailer-ses-transport');
var smtpPassword = require('aws-smtp-credentials');
const dotenv = require('dotenv');
dotenv.config();


function callback(error, info) {
  if (error) {
    console.log(error);
  } else {
    console.log('Message sent: ' + info.response);
  }
}
// 开启一个 SMTP 连接池
transporter = nodemailer.createTransport(sesTransport({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
}));
sesTransporter.sendMail(mailOptions, callback);


function _sendMessage(subject, nessage) {
    let mailOptions = {
        from: process.env.SEND_FROM, // 发件人
        to: process.env.SEND_TO, // 收件人
        subject: subject, // 主题
        text: message, // plain text body
        html: `<b>${message}</b>`, // html body
    };
    transporter.sendMail(mailOptions, callback);
}
module.exports._sendMessage = _sendMessage;
