<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
 public function up()
    {
        Schema::create('recojos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hijo_id')->constrained('hijos')->onDelete('cascade');
            $table->integer('persona_id');
            $table->enum('tipo', ['padre', 'madre', 'familiar', 'tutor']);
            $table->dateTime('fecha_hora');
            $table->enum('metodo_validacion', ['reconocimiento_facial', 'QR']);
            $table->enum('estado', ['permitido', 'denegado']);
            $table->timestamps(0); // Para manejar la fecha de registro de la auditoría
            $table->timestamp('fecha_modificacion')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('recojos');
    }
};
