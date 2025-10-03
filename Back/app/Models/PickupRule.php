<?php

// app/Models/PickupRule.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PickupRule extends Model
{
    protected $fillable = ['hijo_id','personal_id','allowed_days','active','notes'];
    protected $casts = [
        'allowed_days' => 'array',
        'active' => 'boolean',
    ];

    public function hijo() { return $this->belongsTo(Hijo::class); }
    public function personal() { return $this->belongsTo(Personal::class); }
    public function pickupRules() { return $this->hasMany(\App\Models\PickupRule::class); }
}
