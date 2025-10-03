<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistorialRecojo extends Model
{
    protected $table = 'historial_recojos';

    protected $fillable = [
        'hijo_id',
        'personal_id',
        'fecha_hora',
        'tipo'
    ];

    // Relación con el hijo
    public function hijo()
    {
        return $this->belongsTo(Hijo::class, 'hijo_id');
    }

    // Relación con el personal (padre/tutor/familiar)
    public function personal()
    {
        return $this->belongsTo(Personal::class, 'personal_id');
    }
}
