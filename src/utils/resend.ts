import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTicketEmail(to: string, eventName: string, passId: string) {
    try {
        const data = await resend.emails.send({
            from: 'Aditva Passes <onboarding@resend.dev>', // You can change this to your domain later
            to: [to],
            subject: `Your Entry Pass for ${eventName}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0b; color: white; padding: 40px; border-radius: 20px;">
          <h1 style="color: #edff66; font-size: 24px;">Aditva Passes</h1>
          <p>Hey student!</p>
          <p>Your digital pass for <strong>${eventName}</strong> is ready.</p>
          
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
             <p style="margin-bottom: 8px; font-size: 14px; color: #a1a1aa;">PASS ID</p>
             <h2 style="margin: 0; font-size: 32px; letter-spacing: 4px; color: #edff66;">${passId.slice(0, 8).toUpperCase()}</h2>
          </div>

          <p style="font-size: 14px; color: #a1a1aa;">Show this code or the QR in your dashboard at the entry gate.</p>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/student" 
             style="display: inline-block; background: #edff66; color: black; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; margin-top: 20px;">
            View Pass
          </a>
          
          <hr style="margin-top: 40px; border: 0; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="font-size: 12px; color: #666;">This is an automated delivery from Aditva Passes.</p>
        </div>
      `,
        });

        return { success: true, data };
    } catch (error) {
        console.error('Email Error:', error);
        return { success: false, error };
    }
}
