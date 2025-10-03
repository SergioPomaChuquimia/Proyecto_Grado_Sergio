@component('mail::message')
# Recuperación de contraseña

Recibimos una solicitud para restablecer tu contraseña.
Haz clic en el siguiente botón para continuar:

@component('mail::button', ['url' => $url])
Restablecer contraseña
@endcomponent

Si no solicitaste este cambio, ignora este correo.

Gracias,<br>
{{ config('app.name') }}
@endcomponent
