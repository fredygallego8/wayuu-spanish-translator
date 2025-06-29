const { spawn } = require('child_process');
const fs = require('fs');

console.log('🎤 Probando Whisper local...');

// Verificar que existe un archivo de audio
const audioFile = 'data/audio/audio_000.wav';
if (!fs.existsSync(audioFile)) {
    console.error('❌ Archivo de audio no encontrado:', audioFile);
    process.exit(1);
}

console.log('✅ Archivo de audio encontrado:', audioFile);

// Probar Whisper
const whisperProcess = spawn('whisper', [
    audioFile,
    '--model', 'small',
    '--language', 'es',
    '--task', 'transcribe',
    '--output_format', 'txt',
    '--verbose', 'False'
], { stdio: ['pipe', 'pipe', 'pipe'] });

let stdout = '';
let stderr = '';

whisperProcess.stdout.on('data', (data) => {
    stdout += data.toString();
    console.log('📝 Whisper output:', data.toString().trim());
});

whisperProcess.stderr.on('data', (data) => {
    stderr += data.toString();
    console.log('🔧 Whisper info:', data.toString().trim());
});

whisperProcess.on('close', (code) => {
    console.log('🏁 Whisper terminó con código:', code);
    if (code === 0) {
        console.log('✅ ¡Whisper funciona correctamente!');
        console.log('📄 Salida completa:', stdout);
    } else {
        console.log('❌ Error en Whisper:', stderr);
    }
});

whisperProcess.on('error', (error) => {
    console.error('❌ Error al ejecutar Whisper:', error.message);
});
