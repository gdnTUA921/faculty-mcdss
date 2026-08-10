<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReengagementEmail extends Mailable
{
    use Queueable, SerializesModels;

    public string $positionTitle;
    public string $hiringRoundName;

    public function __construct(string $positionTitle, string $hiringRoundName)
    {
        $this->positionTitle = $positionTitle;
        $this->hiringRoundName = $hiringRoundName;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'A New Opportunity Awaits — Reconnect With Us',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reengagement',
            with: [
                'positionTitle'   => $this->positionTitle,
                'hiringRoundName' => $this->hiringRoundName,
            ],
        );
    }
}
