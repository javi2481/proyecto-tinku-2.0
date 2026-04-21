import { getStudentIslands, getCurrentStudent, type IslandWithRegions } from '@/lib/actions/student';
import Link from 'next/link';

export default async function IslandsPage() {
  const student = await getCurrentStudent();
  const islands: IslandWithRegions[] = await getStudentIslands();

  if (!student) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No hay sesión activa</p>
          <Link href="/entrar/codigo" className="text-primary hover:underline">
            Ingresar código
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🌴 ¡Hola, {student.name}!</h1>
            <p className="text-muted-foreground">¿A dónde quieres viajar hoy?</p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {islands.map((island) => (
            <Link
              key={island.id}
              href={`/islas/${island.id}`}
              className="block p-6 border rounded-xl hover:border-primary transition-colors"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-bold">
                  {island.id === 'numeros' ? '🔢' : '👥'} {island.name}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {island.description}
                </p>
                <div className="pt-2 text-sm text-muted-foreground">
                  {island.regions?.length || 0} regiones para explorar
                </div>
              </div>
            </Link>
          ))}

          {islands.length === 0 && (
            <p className="col-span-2 text-center text-muted-foreground py-8">
              No hay islas disponibles todavía
            </p>
          )}
        </div>
      </div>
    </main>
  );
}