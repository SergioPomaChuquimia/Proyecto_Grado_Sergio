<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;

class FaceService
{
    public function analyze(string $imageBase64): ?array
    {
        try {
            $resp = Http::timeout(12)->post(
                env('FACE_API_URL', 'http://127.0.0.1:5000').'/api/embed',
                ['image_base64' => $imageBase64]
            );
        } catch (\Throwable $e) {
            report($e);
            return null;
        }

        if (!$resp->ok()) return null;
        $j = $resp->json();
        if (($j['faces_detected'] ?? 0) !== 1 || empty($j['embedding'])) return null;

        return [
            'embedding'   => $j['embedding'] ?? null,     // float[512]
            'face_base64' => $j['face_base64'] ?? null,   // recorte alineado/recortado
            'box'         => $j['box'] ?? null,
            'confidence'  => (float)($j['confidence'] ?? 0.0),
            'sharpness'   => (float)($j['sharpness'] ?? 0.0),
            'size'        => $j['size'] ?? null,          // ['w'=>..., 'h'=>...]
        ];
    }

    // Compat: si alguien aún llama a embedFromBase64, devolvemos sólo el embedding
    public function embedFromBase64(string $imageBase64): ?array
    {
        $a = $this->analyze($imageBase64);
        return $a['embedding'] ?? null;
    }
}
