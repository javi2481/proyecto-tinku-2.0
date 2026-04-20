# Delta Spec: project-bootstrap (MODIFIED)

## Capability
`project-bootstrap` — Integración de los archivos de prompts de Ari como archivos versionados en el repo.

## MODIFIED Requirements

### REQ-PB-ARI-01: Directorio /prompts/ con archivos .md de Ari

**RFC 2119**: MUST

**Given** el directorio `/prompts/` creado en el change de project-bootstrap
**When** se inspecciona el contenido del directorio
**Then** MUST existir `prompts/ari-base.md` con la identidad compartida de Ari
**And** MUST existir `prompts/quipu.md` con la personalidad matemática
**And** MUST existir `prompts/tinku.md` con la personalidad socioemocional
**And** los archivos MUST estar versionados en Git
**And** los archivos DEBEN estar en formato Markdown (.md) para permitir iteración sin cambio de código

---

### REQ-PB-ARI-02: Prompt base de Ari define principios socráticos

**RFC 2119**: MUST

**Given** el archivo `prompts/ari-base.md`
**When** se inspecciona su contenido
**Then** el prompt MUST definir:
- Identidad: tutor pedagógico, guía con preguntas, NUNCA da respuestas directas
- Lenguaje: español rioplatense con voseo
- Restricciones: no dar soluciones, no revelar respuestas, no evaluar al alumno negativamente
- Principio: festejar esfuerzo, no solo resultado
- Formato de respuesta: breve (1-3 oraciones), orientada a preguntas socráticas