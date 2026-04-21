/**
 * Texto del consentimiento parental v1 como componentes React.
 * Fuente original: /app/frontend/src/content/legal/consent-v1.md
 * Versionar bumpeando el archivo y actualizando CONSENT_TEXT_VERSION en actions.
 */

export const CONSENT_VERSION = 'v1';

export function ConsentTextV1() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-tinku-ink">
      <div className="space-y-1 pb-2 border-b border-tinku-ink/10">
        <h3 className="font-semibold text-base">Consentimiento Parental — Tinkú</h3>
        <p className="text-xs text-tinku-ink/60">
          Versión {CONSENT_VERSION} · Ley 26.061 · Ley 25.326 · AAIP
        </p>
      </div>

      <section className="space-y-2">
        <h4 className="font-semibold">Qué estás autorizando</h4>
        <p>
          Al dar tu consentimiento, autorizás a <strong>Tinkú</strong> (operado por DataFluxIT) a recolectar y
          procesar datos de tu hijo/a menor de edad con el único objetivo de ofrecerle un servicio educativo
          personalizado.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold">Qué datos se recolectan</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Nombre de pila (podés usar un apodo).</li>
          <li>Año de nacimiento y grado escolar actual.</li>
          <li>Código de ingreso de 6 caracteres que Tinkú genera automáticamente.</li>
          <li>Respuestas a los ejercicios, tiempo dedicado y resultado.</li>
          <li>Avatar elegido, XP, logros y rachas.</li>
          <li>Fecha y hora de la última sesión.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold">Qué datos NO se recolectan</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Apellido, DNI, email, teléfono, dirección, escuela o foto de tu hijo/a.</li>
          <li>Geolocalización precisa, contactos, micrófono ni cámara.</li>
          <li>No compartimos datos con terceros publicitarios. No vendemos datos.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold">Seguridad y tus derechos</h4>
        <p>
          Todas las tablas con datos de menores tienen seguridad a nivel de fila activada. Podés en cualquier
          momento:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Ver</strong> todos los datos desde tu panel.</li>
          <li><strong>Corregir</strong> datos incorrectos.</li>
          <li><strong>Revocar</strong> el consentimiento; tu hijo/a pierde acceso inmediato.</li>
          <li>
            <strong>Pedir eliminación total</strong> (derecho al olvido): hard-delete tras 30 días de gracia,
            con anonimización irreversible.
          </li>
          <li><strong>Exportar</strong> los datos en formato legible por máquina.</li>
        </ul>
        <p className="text-xs text-tinku-ink/60">
          Contacto: privacidad@tinku.com.ar
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold">Evidencia legal del consentimiento</h4>
        <p>
          Al darle "Acepto" abajo, registramos de forma <strong>inmutable</strong>: tu identidad, tu IP, tu
          user-agent, la versión {CONSENT_VERSION} de este texto y timestamp. Esta evidencia cumple con los
          requisitos de las Leyes 26.061 y 25.326.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold">Vigencia</h4>
        <p>
          Este consentimiento es válido por 12 meses desde hoy. A los 11 meses te vamos a pedir que lo
          reconfirmes por email.
        </p>
      </section>
    </div>
  );
}
