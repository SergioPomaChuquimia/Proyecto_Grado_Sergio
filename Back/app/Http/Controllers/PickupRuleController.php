<?php
// app/Http/Controllers/PickupRuleController.php
namespace App\Http\Controllers;

use App\Models\PickupRule;
use App\Models\Hijo;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PickupRuleController extends Controller
{
    public function index($hijoId)
    {
        $hijo = Hijo::with('personals:id,name,email')->findOrFail($hijoId);
        $rules = PickupRule::where('hijo_id',$hijoId)
            ->with('personal:id,name,email')
            ->get();
        return response()->json([
            'hijo' => $hijo->only(['id','nombre','apellido','grado']),
            'rules'=> $rules
        ]);
    }

    public function store(Request $request, $hijoId)
    {
        $hijo = Hijo::with('personals:id')->findOrFail($hijoId);
        $data = $request->validate([
            'personal_id'  => ['required','integer', Rule::exists('personals','id')],
            'allowed_days' => ['required','array','min:1'],
            'allowed_days.*' => ['string', Rule::in(['mon','tue','wed','thu','fri','sat','sun'])],
            'active'       => ['boolean'],
            'notes'        => ['nullable','string','max:255'],
        ]);

        // asegurar que el tutor pertenece a este hijo
        if (!$hijo->personals->pluck('id')->contains($data['personal_id'])) {
            return response()->json(['message'=>'El tutor no está asociado a este hijo'], 422);
        }

        // evitar duplicados por pareja
        $rule = PickupRule::updateOrCreate(
            ['hijo_id'=>$hijoId,'personal_id'=>$data['personal_id']],
            [
                'allowed_days'=>$data['allowed_days'],
                'active'=>$request->boolean('active', true),
                'notes'=>$data['notes'] ?? null
            ]
        );

        return response()->json($rule, 201);
    }

    public function update(Request $request, $hijoId, $ruleId)
    {
        $rule = PickupRule::where('hijo_id',$hijoId)->findOrFail($ruleId);
        $data = $request->validate([
            'allowed_days' => ['sometimes','array','min:1'],
            'allowed_days.*' => ['string', Rule::in(['mon','tue','wed','thu','fri','sat','sun'])],
            'active'       => ['sometimes','boolean'],
            'notes'        => ['nullable','string','max:255'],
        ]);
        $rule->update($data);
        return response()->json($rule);
    }

    public function destroy($hijoId, $ruleId)
    {
        $rule = PickupRule::where('hijo_id',$hijoId)->findOrFail($ruleId);
        $rule->delete();
        return response()->json(null, 204);
    }
}
