export default function EliminacionDatosPage() {
    return (
        <main className="w-full max-w-3xl mx-auto py-12 px-4 md:px-8">
            <article className="prose prose-slate max-w-none text-foreground">
                <header className="mb-10 border-b border-border pb-6">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                        Instrucciones para la Eliminación de Datos
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Instrucciones para la Eliminación de Datos de Usuarios
                    </p>
                </header>

                <section className="mb-8">
                    <p className="text-base leading-relaxed mb-4">
                        De acuerdo con las políticas de Meta y las normativas de privacidad, Emanuel Tecnico ofrece a sus usuarios un método claro para solicitar la eliminación completa de sus datos personales recopilados a través de nuestra aplicación.
                    </p>
                    <p className="text-base leading-relaxed mb-4">
                        Si utilizaste el inicio de sesión con Facebook (Facebook Login) en Emanuel Tecnico y deseas que eliminemos todos tus datos de nuestra base de datos, sigue estos pasos:
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Opción 1: Eliminación automática desde Facebook</h2>
                    <ol className="list-decimal list-inside space-y-3 text-base leading-relaxed">
                        <li>
                            Ve a tu cuenta de Facebook y haz clic en 
                            <strong>Configuración y privacidad {' > '} Configuración</strong>.
                        </li>
                        <li>
                            En el menú lateral, selecciona 
                            <strong>Aplicaciones y sitios web</strong>.
                        </li>
                        <li>
                            Busca la aplicación <strong>Emanuel Tecnico</strong>.
                        </li>
                        <li>
                            Haz clic en <strong>Eliminar</strong> o <strong>Quitar</strong>.
                        </li>
                    </ol>
                    <p className="text-base leading-relaxed mt-4">
                        Al realizar esta acción, Facebook nos notificará y procederemos a eliminar tus datos asociados.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Opción 2: Solicitud directa por correo electrónico</h2>
                    <p className="text-base leading-relaxed mb-4">
                        Si prefieres solicitar la eliminación manual de tus datos, puedes hacerlo enviándonos un correo electrónico:
                    </p>
                    <ol className="list-decimal list-inside space-y-3 text-base leading-relaxed">
                        <li>
                            Envía un correo a 
                            <a href="mailto:emanuel_naon@hotmail.com.ar" className="text-blue-600 hover:underline font-medium">
                                emanuel_naon@hotmail.com.ar
                            </a>.
                        </li>
                        <li>
                            En el asunto del correo, escribe: 
                            <strong>"Solicitud de Eliminación de Datos - Emanuel Tecnico"</strong>.
                        </li>
                        <li>
                            En el cuerpo del correo, indícanos el correo electrónico asociado a tu cuenta de Facebook para que podamos identificar tus registros.
                        </li>
                    </ol>
                    <p className="text-base leading-relaxed mt-4">
                        Procesaremos tu solicitud y eliminaremos todos tus datos de nuestros servidores en un plazo máximo de <strong>7 días hábiles</strong>, enviándote una confirmación al finalizar.
                    </p>
                </section>

                <section className="border-t border-border pt-6">
                    <p className="text-base leading-relaxed text-center text-muted-foreground">
                        ¿Volver a la 
                        <a href="/privacidad" className="text-blue-600 hover:underline font-medium">
                            Política de Privacidad
                        </a>?
                    </p>
                </section>
            </article>
        </main>
    );
}