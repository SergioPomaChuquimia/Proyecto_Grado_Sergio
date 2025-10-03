<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hijo extends Model
{
    protected $table = 'hijos';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'apellido',
        'grado',
        'fecha_nac',
        'fecha_registro',
        'fecha_modificacion',
        'estado',
        'ci',  // Agregar 'ci' a los campos que pueden ser asignados masivamente
    ];

    // Relación con Personal
    public function personals()
    {
        return $this->belongsToMany(Personal::class, 'hijo_personal', 'hijo_id', 'personal_id');
    }

    // Relación con PickupRule
    public function pickupRules() 
    {
        return $this->hasMany(\App\Models\PickupRule::class);
    }
}
