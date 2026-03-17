<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicantCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'idNumber'  => $this->id_number,
            'fullName'  => strtoupper(trim(
                "{$this->last_name}, {$this->first_name} " . ($this->middle_initial ?? '')
            )),
            'manual_full_name' => $this->manual_full_name,
            'firstName' => $this->first_name,
            'lastName'  => $this->last_name,
            'course'    => strtoupper($this->course),
            'email'     => $this->email,
            'guardian_name' => $this->guardian_name,
            'guardian_contact' => $this->guardian_contact,
            'address'   => $this->address,
            'photo'     => $this->id_picture
                ? route('proxy.image', ['path' => $this->id_picture])
                : null,
            'signature' => $this->signature_picture
                ? route('proxy.image', ['path' => $this->signature_picture])
                : null,
            'paymentProof' => $this->payment_proof
                ? route('proxy.image', ['path' => $this->payment_proof])
                : null,
            'reissuance_reason' => $this->reissuance_reason,
        ];
    }
}
