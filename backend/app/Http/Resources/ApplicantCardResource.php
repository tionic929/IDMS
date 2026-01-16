<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicantCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'idNumber'  => $this->id_number,
            'fullName'  => strtoupper(trim(
                "{$this->last_name}, {$this->first_name} " . ($this->middle_initial ?? '')
            )),
            'course'    => strtoupper($this->course),
            'photo'     => $this->id_picture
                ? asset('storage/' . $this->id_picture)
                : null,
            'signature' => $this->signature_picture
                ? asset('storage/' . $this->signature_picture)
                : null,
        ];
    }
}
