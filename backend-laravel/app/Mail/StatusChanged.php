<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StatusChanged extends Mailable
{
    use Queueable, SerializesModels;

    public string $positionTitle;
    public string $previousStatus;
    public string $newStatus;

    public function __construct(string $positionTitle, string $previousStatus, string $newStatus)
    {
        $this->positionTitle = $positionTitle;
        $this->previousStatus = $previousStatus;
        $this->newStatus = $newStatus;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Application Status Has Changed',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.status-changed',
            with: [
                'positionTitle'  => $this->positionTitle,
                'previousStatus' => $this->previousStatus,
                'newStatus'      => $this->newStatus,
            ],
        );
    }
}
