// Middleware para loggear peticiones HTTP 
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const origin = req.headers.origin || "No origin";
  const auth = req.headers.authorization ? "Con token" : "Sin token";

  // Filtrar OPTIONS requests y requests repetitivos sin token para reducir ruido
  const shouldLog = !(
    method === "OPTIONS" ||
    (url.includes("/auth/refresh") && !req.headers.authorization)
  );

  if (shouldLog) {
    console.log(`\n📨 [${timestamp}] ${method} ${url}`);
    console.log(`   Origin: ${origin}`);
    console.log(`   Auth: ${auth}`);

    // Capturar el código de respuesta
    const originalSend = res.send;
    res.send = function (data) {
      console.log(`   ✅ Response: ${res.statusCode}`);
      originalSend.call(this, data);
    };
  }
  

  next();
};
