@component('mail::message')
# Código de verificación

Tu código de verificación es **{{ $code }}**.

Este código expirará en 10 minutos.

Gracias,<br>
{{ config('app.name') }}
@endcomponent
