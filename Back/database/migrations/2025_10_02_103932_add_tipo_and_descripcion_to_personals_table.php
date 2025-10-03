<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
 public function up()
    {
        Schema::table('personals', function (Blueprint $table) {
            // Agregar el campo 'tipo' con los valores posibles
            $table->enum('tipo', ['padre', 'madre', 'tutor', 'familiar'])->default('familiar');

            // Agregar el campo 'descripcion'
            $table->text('descripcion')->nullable();
        });
    }

    /**
     * Revertir la migración.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('personals', function (Blueprint $table) {
            // Eliminar los campos agregados
            $table->dropColumn('tipo');
            $table->dropColumn('descripcion');
        });
    }
};
