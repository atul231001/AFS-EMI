import nodemailer from 'nodemailer';
import SystemConfig from '../models/SystemConfig.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import NotificationLog from '../models/NotificationLog.js';

export const sendNotification = async (event, recipientData, metadata = {}) => {
  try {
    // 1. Check if event is enabled in SystemConfig
    const config = await SystemConfig.findOne();
    if (!config || !config.notifications[event]) {
      console.log(`Notification for event ${event} is disabled.`);
      return { success: false, message: 'Notification disabled' };
    }

    // 2. Get Template
    const template = await NotificationTemplate.findOne({ event, enabled: true });
    if (!template) {
      console.log(`No active template found for event ${event}.`);
      return { success: false, message: 'Template not found' };
    }

    // 3. Process Body (Replace variables)
    let body = template.body;
    let subject = template.subject;

    const allData = { ...recipientData, ...metadata };
    
    Object.keys(allData).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      body = body.replace(placeholder, allData[key]);
      subject = subject.replace(placeholder, allData[key]);
    });

    // 4. Wrap plain text in professional HTML template if needed
    if (!body.includes('<div') && !body.includes('<p')) {
      const formattedBody = body.replace(/\n/g, '<br/>');
      body = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e1e4e8; border-radius: 16px; background-color: #ffffff; color: #1f2328;">
          <div style="margin-bottom: 30px; border-bottom: 2px solid #f0883e; padding-bottom: 20px;">
            <h2 style="color: #f0883e; text-transform: uppercase; font-style: italic; margin: 0; font-size: 24px; letter-spacing: -0.5px;">LiuGong <span style="font-weight: normal; color: #1f2328;">Finance Portal</span></h2>
          </div>
          
          <div style="font-size: 15px; line-height: 1.6; color: #24292f;">
            ${formattedBody}
          </div>
          
          <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #f0f1f2; font-size: 11px; color: #6e7781; text-align: center;">
            <p style="margin: 0;">This is an automated notification from the LiuGong EMI Management System.</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} LiuGong Construction Machinery. All rights reserved.</p>
          </div>
        </div>
      `;
    }

    // 5. Send via Email (if channel exists)
    if (template.channels.includes('email')) {
      const smtp = config.smtp;
      if (!smtp || !smtp.user || !smtp.pass) {
        throw new Error('SMTP configuration incomplete');
      }

      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure, // true for 465, false for other ports
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
      });

      const mailOptions = {
        from: smtp.from,
        to: allData.email,
        subject: subject,
        html: body,
      };

      const info = await transporter.sendMail(mailOptions);
      
      // 5. Log Success
      await NotificationLog.create({
        event,
        channel: 'email',
        recipient: allData.email,
        subject,
        body,
        status: 'Sent',
        metadata: { messageId: info.messageId, ...metadata }
      });

      return { success: true, messageId: info.messageId };
    }

    return { success: false, message: 'No valid channel found' };
  } catch (error) {
    console.error('Notification Error:', error);
    
    // Log Failure
    await NotificationLog.create({
      event,
      channel: 'email',
      recipient: recipientData.email || 'unknown',
      status: 'Failed',
      error: error.message,
      metadata
    });

    return { success: false, error: error.message };
  }
};
