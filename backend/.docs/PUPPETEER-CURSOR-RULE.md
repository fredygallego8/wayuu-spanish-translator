# REGLA DE CURSOR: PUPPETEER - CONFIGURACIÓN Y MEJORES PRÁCTICAS

Esta regla proporciona guía completa para el uso efectivo de Puppeteer en entornos Linux, especialmente para automatización de pruebas y screenshots de aplicaciones web.

## 🚨 CONFIGURACIÓN CRÍTICA PARA LINUX

### Problema Principal: Sandbox Restrictions
- **Error común:** `Failed to launch the browser process! No usable sandbox!`
- **Causa:** Restricciones de seguridad en sistemas Linux
- **Solución obligatoria:**

```javascript
// SIEMPRE usar estas configuraciones en Linux
const launchOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox', 
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ]
};

// En llamadas MCP
{
  "allowDangerous": true,
  "launchOptions": launchOptions
}
```

## 📋 SELECTORES CSS CORRECTOS

### ❌ NUNCA Usar:
```javascript
// Estos NO funcionan en querySelector
'span:contains("text")'      // Pseudo-selector inválido
'div:has(span)'              // No soportado
'button:nth-child(2n+1)'     // Complejo innecesario
```

### ✅ SIEMPRE Usar:
```javascript
// Selectores de atributos (MÁS CONFIABLES)
'input[name="user"]'         // Por atributo name
'button[type="submit"]'      // Por tipo
'div[data-testid="login"]'   // Por data attributes

// Selectores por clase/ID (ESPECÍFICOS)
'#login-button'              // Por ID
'.login-form'                // Por clase
'form.auth-form button'      // Combinados específicos

// Selectores estructurales (SIMPLES)
'form button'                // Descendiente directo
'nav > a'                    // Hijo directo
```

## 🔄 FLUJO DE TRABAJO RECOMENDADO

### 1. Navegación Inicial
```javascript
// SIEMPRE incluir configuración de seguridad
await puppeteer_navigate({
  url: "http://localhost:3001",
  allowDangerous: true,
  launchOptions: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  }
});
```

### 2. Interacción con Elementos
```javascript
// Orden recomendado:
// 1. Fill inputs
await puppeteer_fill({
  selector: 'input[name="user"]',
  value: 'admin'
});

// 2. Fill passwords
await puppeteer_fill({
  selector: 'input[name="password"]', 
  value: 'password123'
});

// 3. Submit/Click
await puppeteer_click({
  selector: 'button[type="submit"]'
});

// 4. Verificar resultado
await puppeteer_screenshot({
  name: 'after_login',
  width: 1200,
  height: 800
});
```

## 🐛 MANEJO DE ERRORES COMUNES

### Error: "No usable sandbox"
```bash
# Solución: Flags de sandbox en launchOptions
--no-sandbox --disable-setuid-sandbox
```

### Error: "No element found for selector"
```javascript
// Problema: Selector incorrecto o timing
// Solución: Verificar con DevTools y usar selectores específicos

// Antes de hacer click, verificar existencia:
const element = await page.$('button[type="submit"]');
if (!element) {
  throw new Error('Login button not found');
}
```

### Error: "Failed to launch browser process"
```bash
# Verificar prerrequisitos del sistema:
sudo systemctl status docker    # Docker debe estar corriendo
lsof -i :PORT                  # Verificar puertos disponibles
```

## 🔧 VERIFICACIÓN DE ENTORNO

### Pre-requisitos del Sistema
```bash
# Verificar servicios necesarios
docker info > /dev/null 2>&1      # Docker funcionando
curl -s http://localhost:3001      # Grafana disponible
curl -s http://localhost:3002/api/health  # Backend respondiendo
```

### Configuración de Puertos
```javascript
// Puertos estándar del stack Wayuu Translator
const PORTS = {
  frontend: 4000,
  grafana: 3001, 
  backend: 3002,
  prometheus: 9090,
  alertmanager: 9093
};

// Verificar antes de usar Puppeteer
for (const [service, port] of Object.entries(PORTS)) {
  // Verificar que el servicio esté UP
  const response = await fetch(`http://localhost:${port}`);
  if (!response.ok) {
    console.warn(`${service} no disponible en puerto ${port}`);
  }
}
```

## 📸 MEJORES PRÁCTICAS PARA SCREENSHOTS

### Configuración Recomendada
```javascript
await puppeteer_screenshot({
  name: 'descriptive_name',
  width: 1400,    // Ancho suficiente para dashboards
  height: 900,    // Alto balanceado
  selector: null  // Full page por defecto
});

// Para elementos específicos
await puppeteer_screenshot({
  name: 'login_form',
  selector: '.login-container',  // Solo el formulario
  width: 600,
  height: 400
});
```

## 🔄 DEBUGGING Y TROUBLESHOOTING

### Estrategias de Debug
```javascript
// 1. Screenshots incrementales para debug
await puppeteer_screenshot({name: 'step_1_initial'});
await puppeteer_fill({selector: 'input[name="user"]', value: 'admin'});
await puppeteer_screenshot({name: 'step_2_username_filled'});
await puppeteer_fill({selector: 'input[name="password"]', value: 'pass'});
await puppeteer_screenshot({name: 'step_3_password_filled'});
await puppeteer_click({selector: 'button[type="submit"]'});
await puppeteer_screenshot({name: 'step_4_after_submit'});

// 2. Verificar elementos antes de interactuar
await puppeteer_evaluate({
  script: `
    const element = document.querySelector('input[name="user"]');
    console.log('Element found:', !!element);
    console.log('Element visible:', element ? element.offsetHeight > 0 : false);
    return !!element;
  `
});
```

### Log de Errores Útiles
```javascript
// Capturar información del estado actual
await puppeteer_evaluate({
  script: `
    return {
      url: window.location.href,
      title: document.title,
      forms: document.forms.length,
      inputs: document.querySelectorAll('input').length,
      buttons: document.querySelectorAll('button').length
    };
  `
});
```

## 📝 CHECKLIST PRE-EJECUCIÓN

### Antes de usar Puppeteer:
- [ ] Docker está corriendo (`docker info`)
- [ ] Servicios target están UP (curl health checks)
- [ ] Puertos necesarios están libres (`lsof -i :PORT`)
- [ ] Configuración de launch options incluye flags de sandbox
- [ ] Selectores verificados en DevTools
- [ ] allowDangerous: true en entornos Linux

### Durante la ejecución:
- [ ] Usar screenshots para verificación visual
- [ ] Manejar errores de elementos no encontrados
- [ ] Verificar timing entre acciones
- [ ] Logs detallados para debugging

### Post-ejecución:
- [ ] Verificar que screenshots muestran estado esperado
- [ ] Limpiar procesos/recursos si es necesario
- [ ] Documentar selectores que funcionaron bien

---

## 📚 EJEMPLOS PRÁCTICOS

### Ejemplo Completo: Login a Grafana
```javascript
// 1. Navegación segura
await puppeteer_navigate({
  url: "http://localhost:3001",
  allowDangerous: true,
  launchOptions: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  }
});

// 2. Screenshot inicial
await puppeteer_screenshot({name: 'grafana_login_page', width: 1200, height: 800});

// 3. Llenar credenciales
await puppeteer_fill({selector: 'input[name="user"]', value: 'admin'});
await puppeteer_fill({selector: 'input[name="password"]', value: 'wayuu2024'});

// 4. Submit
await puppeteer_click({selector: 'button[type="submit"]'});

// 5. Verificar resultado
await puppeteer_screenshot({name: 'grafana_dashboard', width: 1400, height: 900});
```

Esta regla debe aplicarse consistentemente para evitar errores comunes y asegurar automatización confiable con Puppeteer en el entorno Wayuu Translator. 