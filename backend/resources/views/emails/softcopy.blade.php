<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your ID Card Softcopy</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f4f7f9;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #2563eb;
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .content {
            padding: 40px;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 20px;
            font-size: 16px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        .attachment-info {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #1e40af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ID Card Issued</h1>
        </div>
        <div class="content">
            <p>Dear <strong>{{ $student_name }}</strong>,</p>
            <p>We are pleased to inform you that your ID card has been successfully processed and issued.</p>
            
            <div class="attachment-info">
                <strong>Important:</strong> We have attached a high-quality softcopy of your ID card (Front and Back) to this email for your records and immediate use.
            </div>
            <p>Best regards,<br>
            <strong>ID TECH Team</strong></p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} ID TECH NC. All rights reserved.<br>
            This is an automated message, please do not reply.
        </div>
    </div>
</body>
</html>
