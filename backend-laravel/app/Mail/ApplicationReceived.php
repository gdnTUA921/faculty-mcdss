<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApplicationReceived extends Mailable
{
    use Queueable, SerializesModels;

    public string $applicantName;
    public string $positionTitle;

    public function __construct(string $applicantName, string $positionTitle)
    {
        $this->applicantName = $applicantName;
        $this->positionTitle = $positionTitle;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Application Received',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.application-received',
            with: [
                'applicantName' => $this->applicantName,
                'positionTitle' => $this->positionTitle,
            ],
        );
    }
}
