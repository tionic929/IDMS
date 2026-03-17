<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class SubmissionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $student;

    /**
     * Create a new notification instance.
     */
    public function __construct($student)
    {
        $this->student = $student;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'New Application',
            'message' => "New ID application received from {$this->student->full_name} ({$this->student->id_number}).",
            'type' => 'info',
            'action_url' => '/admin/card-management?select=' . $this->student->id_number,
            'student_id' => $this->student->id,
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'data' => $this->toArray($notifiable),
            'read_at' => null,
            'created_at' => now()->toDateTimeString(),
        ]);
    }
    
    public function broadcastOn()
    {
        return ['dashboard'];
    }
}
