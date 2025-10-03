<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ModifyPersonaIdColumnInRecojosTable extends Migration
{
    public function up()
    {
        Schema::table('recojos', function (Blueprint $table) {
            $table->unsignedBigInteger('persona_id')->change();
        });
    }

    public function down()
    {
        Schema::table('recojos', function (Blueprint $table) {
            $table->integer('persona_id')->change();
        });
    }
}