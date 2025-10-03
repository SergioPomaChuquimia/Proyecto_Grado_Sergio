<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up()
    {
        Schema::table('hijos', function (Blueprint $table) {
            // Agregar el campo ci
            $table->string('ci', 20)->unique()->after('grado');  // Aseguramos que sea único y lo colocamos después de 'grado'
        });
    }

    public function down()
    {
        Schema::table('hijos', function (Blueprint $table) {
            // Eliminar el campo ci si es necesario
            $table->dropColumn('ci');
        });
    }
};
