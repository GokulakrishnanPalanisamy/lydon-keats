<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubtaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'estimated_time' => $this->estimated_time,
            'estimated_time_unit' => $this->estimated_time_unit,
            'sort_order' => $this->sort_order,
        ];
    }
}
