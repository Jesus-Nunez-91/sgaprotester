// Stress Test Script utilizando Native Fetch (Node 18+)
const TARGET = 'http://localhost:3030/api/auth/login';
const REQUESTS = 15;

async function testStress() {
  console.log(`🚀 Iniciando Prueba de Estrés: Enviando ${REQUESTS} peticiones de login simultáneas...`);
  
  const start = Date.now();
  const promises = [];

  for (let i = 0; i < REQUESTS; i++) {
    promises.push(
      fetch(TARGET, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'test_stress@uah.cl', password: 'wrong' })
      }).then(async res => {
          return { status: res.status, data: await res.json() };
      }).catch(e => ({ error: e.message }))
    );
  }

  const results = await Promise.all(promises);
  const end = Date.now();

  const successCount = results.filter(r => r.status === 401).length;
  const rateLimitCount = results.filter(r => r.status === 429).length;
  const errorCount = results.filter(r => r.error).length;

  console.log(`\n📊 RESULTADOS:`);
  console.log(`- Tiempo total: ${end - start}ms`);
  console.log(`- Peticiones Rechazadas (Credenciales): ${successCount}`);
  console.log(`- Bloqueos por Intrución (Rate Limit 429): ${rateLimitCount}`);
  console.log(`- Errores de Red: ${errorCount}`);

  if (rateLimitCount > 0) {
    console.log(`✅ TEST EXITOSO: El escudo de seguridad (Rate Limit) está ACTIVO.`);
  } else {
    console.warn(`⚠️ ALERTA: No se detectó bloqueo. Es posible que el Rate Limit esté configurado muy alto para esta carga.`);
  }
}

testStress();
