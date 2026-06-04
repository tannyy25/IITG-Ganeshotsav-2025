const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendDigitalSlip = async (userData) => {
  const { name, rollNumber, email, type, itemDetails, amount, _id } = userData;

  const mailOptions = {
    from: `"IITG Ganesh Utsav Committee" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Receipt: Your ${type === 'DONATION' ? 'Donation' : 'Merch Order'} Acknowledgment`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; background: #ffffff; color: #333333;">
        <h2 style="color: #D4A843; margin-bottom: 5px; margin-top: 0;">GANESHUTSAV IIT GUWAHATI</h2>
        <p style="color: #666; font-size: 14px; margin-top: 0;">Official Digital Slip</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="margin: 10px 0;"><strong>Contributor Name:</strong> ${name}</p>
        <p style="margin: 10px 0;"><strong>Roll Number:</strong> ${rollNumber}</p>
        <p style="margin: 10px 0;"><strong>Allocation:</strong> ${itemDetails}</p>
        <p style="font-size: 18px; margin-top: 25px; margin-bottom: 5px;"><strong>Amount Paid:</strong> <span style="color: #9E322D; font-weight: bold;">₹${amount}</span></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">Thank you for your support. This is an automatically generated system receipt.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendDigitalSlip };