export default function PrivacidadPage() {
    return (
        <main className="w-full max-w-3xl mx-auto py-12 px-4 md:px-8">
            <article className="prose prose-slate max-w-none text-foreground">
                <header className="mb-10 border-b border-border pb-6">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                        Política de Privacidad
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Política de Privacidad de Emanuel Tecnico
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                        Última actualización: 12 de octubre de 2026
                    </p>
                </header>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">1. Introducción</h2>
                    <p className="text-base leading-relaxed mb-4">
                        Bienvenido a Emanuel Tecnico. Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos la información del usuario en relación con nuestra aplicación y los servicios de inicio de sesión de Meta (Facebook Login).
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">2. Información que recopilamos</h2>
                    <p className="text-base leading-relaxed mb-4">
                        Cuando decides iniciar sesión o conectar nuestra aplicación a través de Facebook, recopilamos la información pública básica de tu perfil que tú autorizas expresamente. Esto incluye:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-base leading-relaxed">
                        <li>Nombre y apellidos.</li>
                        <li>Dirección de correo electrónico.</li>
                        <li>Foto de perfil.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">3. Uso de la información</h2>
                    <p className="text-base leading-relaxed mb-4">
                        Utilizamos la información recopilada exclusivamente para:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-base leading-relaxed">
                        <li>Crear y gestionar tu cuenta de usuario en nuestra plataforma.</li>
                        <li>Identificarte cuando inicias sesión en el sistema.</li>
                        <li>Proporcionarte asistencia técnica o comunicarnos contigo respecto a tus solicitudes.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">4. Compartir información</h2>
                    <p className="text-base leading-relaxed">
                        Emanuel Tecnico no vende, alquila ni comparte tu información personal con terceros para fines comerciales o de marketing. Los datos solo se mantienen en nuestra base de datos para el funcionamiento de la aplicación.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">5. Seguridad de los datos</h2>
                    <p className="text-base leading-relaxed">
                        Implementamos medidas de seguridad estándar de la industria para proteger tu información contra el acceso no autorizado, la alteración, divulgación o destrucción.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">6. Derechos del usuario y eliminación de datos</h2>
                    <p className="text-base leading-relaxed mb-4">
                        Tienes derecho a acceder a tu información personal y a solicitar su eliminación en cualquier momento. Para saber cómo eliminar tus datos de nuestra aplicación, consulta nuestras <a 
                        href="/eliminacion-datos" 
                        className="text-blue-600 hover:underline font-medium">
                            Instrucciones de Eliminación de Datos
                        </a>.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">7. Contacto</h2>
                    <p className="text-base leading-relaxed mb-2">
                        Si tienes alguna pregunta sobre esta Política de Privacidad, puedes contactarnos en:
                    </p>
                    <p className="text-base leading-relaxed">
                        <a href="mailto:emanuel_naon@hotmail.com.ar" className="text-blue-600 hover:underline font-medium">
                            emanuel_naon@hotmail.com.ar
                        </a>
                    </p>
                </section>
            </article>
        </main>
    );
}