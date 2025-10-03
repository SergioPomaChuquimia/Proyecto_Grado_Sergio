<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Personal extends Model
{
    use HasFactory;

    // Usa tus columnas personalizadas como timestamps
    const CREATED_AT = 'fecha_registro';
    const UPDATED_AT = 'fecha_modificacion';

    protected $fillable = [
        'name',
        'apellido',
        'email',
        'telefono',
        'ci',
        'direccion',
        'usuario',
        'password',
        'embedding',
        'photo',
        'estado',
        'tipo',           // Asegúrate de incluir 'tipo' si no lo habías hecho ya
        'descripcion',    // Agregar 'descripcion' aquí
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'embedding' => 'array',
        'fecha_registro' => 'datetime',
        'fecha_modificacion' => 'datetime',
    ];

    public function hijos()
    {
        return $this->belongsToMany(\App\Models\Hijo::class, 'hijo_personal', 'personal_id', 'hijo_id');
    }
}

