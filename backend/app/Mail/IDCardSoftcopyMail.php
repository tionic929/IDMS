<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class IDCardSoftcopyMail extends Mailable
{
    use Queueable, SerializesModels;

    public $student_name;
    public $image_data;

    /**
     * Create a new message instance.
     */
    public function __construct($student_name, $image_data)
    {
        $this->student_name = $student_name;
        $this->image_data = $image_data;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your ID Card Softcopy - ' . $this->student_name,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.softcopy',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        // image_data is expected to be a base64 string including the data:image/png;base64, prefix
        if (!$this->image_data) return [];

        try {
            // Remove prefix if exists
            $data = $this->image_data;
            if (preg_match('/^data:image\/(\w+);base64,/', $data, $type)) {
                $data = substr($data, strpos($data, ',') + 1);
            }
            $decoded = base64_decode($data);

            return [
                \Illuminate\Mail\Mailables\Attachment::fromData(
                    fn() => $decoded,
                    'ID_CARD_' . str_replace(' ', '_', $this->student_name) . '.png'
                )->withMime('image/png'),
            ];
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to attach ID card: ' . $e->getMessage());
            return [];
        }
    }
}
