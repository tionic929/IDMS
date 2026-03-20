<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Update - ID TECH NC</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f7f6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
            background-color: #e53e3e; /* Red color to indicate attention/rejection */
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 4px solid #c53030;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            letter-spacing: 1px;
        }
        .content {
            padding: 30px;
            color: #4a5568;
        }
        .content p {
            margin-bottom: 15px;
            font-size: 16px;
        }
        .highlight {
            background-color: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 4px 4px 0;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #718096;
            border-top: 1px solid #edf2f7;
        }
        strong {
            color: #2d3748;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ID TECH NC</h1>
            <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Application Update</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>{{ $studentName }}</strong>,</p>
            
            <p>We are writing to inform you that your recent application for an ID card has not been approved at this time.</p>
            
            <div class="highlight">
                <strong>Why was it not approved?</strong><br>
                This could be due to missing/incorrect information, an unclear photograph, or an invalid proof of payment. 
            </div>

            <p>If you believe this is an error, or if you would like to know the exact reason and resubmit your details, please contact the administration office immediately.</p>
            
            <p>Best regards,<br>
            <strong>ID TECH Team</strong></p>
        </div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} ID TECH NC. All rights reserved.</p>
            <p>This is an automated message, please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>
