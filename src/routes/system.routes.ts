import { Router, Request, Response } from 'express';
import { sendMail } from '../services/email.service';

const router = Router();

interface EmailBody {
  email: string;
  subject?: string;
  message: string;
}

/**
 * @route POST /api/system/send-email
 * @desc General endpoint to send emails from the frontend
 */
router.post('/send-email', async (req: Request<{}, {}, EmailBody>, res: Response) => {
  try {
    const { email, subject, message } = req.body;

    await sendMail({
      to: email,
      subject: subject || "Message from PureRaise",
      text: message,
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
