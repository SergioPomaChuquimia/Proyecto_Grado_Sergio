<?php

namespace App\Http\Controllers;

use App\Models\Personal;
use App\Models\Hijo;
use App\Models\PickupRule;
use Illuminate\Http\Request;
use App\Services\FaceService;
use App\Models\HistorialRecojo;

class VerifyController extends Controller
{
    public function verify(Request $request, FaceService $face)
    {
        $data = $request->validate([
            'image' => 'required|string',
        ]);

        $analysis = $face->analyze($data['image']);
        if (!$analysis) {
            return response()->json(['result' => 'no_face_detected'], 200);
        }

        if (($analysis['confidence'] ?? 0) < 0.95 || ($analysis['sharpness'] ?? 0) < 100) {
            return response()->json(['result' => 'no_face_detected'], 200);
        }

        $probe = $analysis['embedding'] ?? null;
        if (!is_array($probe) || empty($probe)) {
            return response()->json(['result' => 'no_face_detected'], 200);
        }

        // Match por coseno
        $best = null;
        $bestScore = -1.0;
        $personals = Personal::select('id','name','apellido','email','ci','tipo','descripcion','embedding')->get();

        foreach ($personals as $p) {
            if (!is_array($p->embedding) || empty($p->embedding)) continue;
            $score = $this->cosineSimilarity($probe, $p->embedding);
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $p;
            }
        }

        $THRESHOLD = 0.85;
        if ($best && $bestScore >= $THRESHOLD) {
            $map = [1=>'mon', 2=>'tue', 3=>'wed', 4=>'thu', 5=>'fri', 6=>'sat', 7=>'sun'];
            $todayKey = $map[(int) now()->format('N')];

            $hijos = Hijo::whereHas('personals', function ($q) use ($best) {
                $q->where('personals.id', $best->id);
            })->get();

            $children = [];
            foreach ($hijos as $hijo) {
                $rule = PickupRule::where('hijo_id', $hijo->id)
                    ->where('personal_id', $best->id)
                    ->where('active', true)
                    ->first();

                $allowed = true;
                $days = [];
                if ($rule) {
                    $days = is_array($rule->allowed_days) ? $rule->allowed_days : [];
                    $allowed = in_array($todayKey, $days, true);
                }

                $children[] = [
                    'id'            => $hijo->id,
                    'nombre'        => $hijo->nombre,
                    'apellido'      => $hijo->apellido,
                    'grado'         => $hijo->grado,
                    'allowed_today' => $allowed,
                    'days'          => $days,
                ];

                // Insertar historial solo si está permitido hoy
                if ($allowed) {
                    // ¿Alguien ya lo retiró hoy?
                    $existeGeneral = HistorialRecojo::where('hijo_id', $hijo->id)
                        ->whereDate('fecha_hora', now()->toDateString())
                        ->latest('fecha_hora')
                        ->first();

                    if ($existeGeneral) {
                        // Fue retirado por otra persona
                        if ((int) $existeGeneral->personal_id !== (int) $best->id) {
                            $retirador = Personal::select('id','name','apellido','tipo')
                                ->find($existeGeneral->personal_id);

                            $descripcion = ($best->tipo === 'tutor' || $best->tipo === 'familiar') ? $best->descripcion : null;

                            return response()->json([
                                'result'      => 'picked_by_other',
                                'message'     => 'Su hijo ya fue retirado por una persona.',
                                'match'       => [
                                    'id'          => $best->id,
                                    'name'        => $best->name,
                                    'apellido'    => $best->apellido ?? null,
                                    'email'       => $best->email,
                                    'ci'          => $best->ci,
                                    'tipo'        => $best->tipo ?? null,
                                    'descripcion' => $descripcion,
                                ],
                                'children'    => $children,
                                'picked_child'=> [
                                    'id'       => $hijo->id,
                                    'nombre'   => $hijo->nombre,
                                    'apellido' => $hijo->apellido,
                                    'grado'    => $hijo->grado,
                                ],
                                'picked_by'   => $retirador ? [
                                    'id'       => $retirador->id,
                                    'name'     => $retirador->name,
                                    'apellido' => $retirador->apellido,
                                    'tipo'     => $retirador->tipo,
                                ] : null,
                                'picked_at'   => $existeGeneral->fecha_hora,
                                'similarity'  => round($bestScore, 4),
                                'threshold'   => $THRESHOLD,
                            ], 200);
                        }

                        // Mismo tutor intentando registrar otra vez
                        $descripcion = ($best->tipo === 'tutor' || $best->tipo === 'familiar') ? $best->descripcion : null;

                        return response()->json([
                            'result'     => 'already_registered',
                            'message'    => 'Su registro y recojo a su hijo ya fue registrado.',
                            'match'      => [
                                'id'          => $best->id,
                                'name'        => $best->name,
                                'apellido'    => $best->apellido ?? null,
                                'email'       => $best->email,
                                'ci'          => $best->ci,
                                'tipo'        => $best->tipo ?? null,
                                'descripcion' => $descripcion,
                            ],
                            'children'   => $children,
                            'similarity' => round($bestScore, 4),
                            'threshold'  => $THRESHOLD,
                        ], 200);
                    }

                    // Nadie lo retiró aún → registrar
                    HistorialRecojo::create([
                        'hijo_id'     => $hijo->id,
                        'personal_id' => $best->id,
                        'fecha_hora'  => now(),
                        'tipo'        => $best->tipo,
                    ]);
                }
            }

            $descripcion = ($best->tipo === 'tutor' || $best->tipo === 'familiar') ? $best->descripcion : null;

            return response()->json([
                'result'     => 'registered',
                'match'      => [
                    'id'          => $best->id,
                    'name'        => $best->name,
                    'apellido'    => $best->apellido ?? null,
                    'email'       => $best->email,
                    'ci'          => $best->ci,
                    'tipo'        => $best->tipo ?? null,
                    'descripcion' => $descripcion,
                ],
                'children'   => $children,
                'similarity' => round($bestScore, 4),
                'threshold'  => $THRESHOLD,
            ], 200);
        }

        return response()->json([
            'result'     => 'not_registered',
            'similarity' => round($bestScore, 4),
            'threshold'  => $THRESHOLD,
        ], 200);
    }

    private function cosineSimilarity(array $a, array $b): float
    {
        $n = min(count($a), count($b));
        if ($n === 0) return -1.0;
        $dot = 0.0; $na = 0.0; $nb = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $dot += $a[$i] * $b[$i];
            $na  += $a[$i] * $a[$i];
            $nb  += $b[$i] * $b[$i];
        }
        if ($na == 0.0 || $nb == 0.0) return -1.0;
        return $dot / (sqrt($na) * sqrt($nb));
    }
}
