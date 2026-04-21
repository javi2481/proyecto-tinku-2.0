import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 space-y-12">
      {/* Logo + Title */}
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary">Tinku</h1>
        <p className="text-xl text-muted-foreground">
          La aventura de aprender matemática
        </p>
      </div>

      {/* Entry Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl w-full">
        {/* Parent Entry */}
        <Link
          href="/entrar"
          className="flex flex-col items-center p-8 border-2 border-primary/20 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all"
        >
          <div className="text-4xl mb-4">👨‍👩‍👧</div>
          <h2 className="text-xl font-bold">Papás</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Crear cuenta o iniciar sesión
          </p>
        </Link>

        {/* Student Entry */}
        <Link
          href="/entrar/codigo"
          className="flex flex-col items-center p-8 border-2 border-secondary/20 rounded-2xl hover:border-secondary hover:bg-secondary/5 transition-all"
        >
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-xl font-bold">Estudiantes</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Ingresar con código
          </p>
        </Link>
      </div>

      {/* Info */}
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Tinku es una plataforma pedagógica para aprender matemática de forma
        lúdica. Designed para niños de 1° a 3° grado.
      </p>
    </main>
  );
}