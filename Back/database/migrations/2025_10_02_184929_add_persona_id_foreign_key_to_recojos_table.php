<?php



use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPersonaIdForeignKeyToRecojosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('recojos', function (Blueprint $table) {
            // Agregar la clave foránea para persona_id
            $table->foreign('persona_id')
                  ->references('id')
                  ->on('personals')
                  ->onDelete('cascade'); // Eliminar registros en recojos si la persona relacionada se elimina
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('recojos', function (Blueprint $table) {
            // Eliminar la clave foránea
            $table->dropForeign(['persona_id']);
        });
    }
}
