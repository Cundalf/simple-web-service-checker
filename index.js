const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

class WebServiceChecker {
    constructor() {
        this.url = process.env.SERVICE_URL;
        this.normalInterval = 30 * 60 * 1000; // 30 minutos
        this.retryInterval = 5 * 60 * 1000; // 5 minutos
        this.maxRetries = 3; // Máximo 3 reintentos (4 intentos total)
        this.failureCount = 0;
        this.isInRetryMode = false;
        this.emailSent = false;
        
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        
        console.log(`Iniciando monitoreo de: ${this.url}`);
        console.log(`Intervalo normal: ${this.normalInterval / 1000 / 60} minutos`);
        console.log(`Intervalo de reintento: ${this.retryInterval / 1000 / 60} minutos`);
    }
    
    async checkService() {
        try {
            const response = await axios.get(this.url, {
                timeout: 10000,
                validateStatus: (status) => status < 400
            });
            
            console.log(`✅ Servicio OK - Status: ${response.status} - ${new Date().toISOString()}`);
            
            // Si estaba en modo retry y ahora funciona, resetear
            if (this.isInRetryMode) {
                console.log('🔄 Servicio recuperado, volviendo al monitoreo normal');
                this.resetToNormalMode();
            }
            
            return true;
        } catch (error) {
            console.log(`❌ Servicio FALLO - ${error.message} - ${new Date().toISOString()}`);
            this.handleFailure();
            return false;
        }
    }
    
    handleFailure() {
        this.failureCount++;
        
        if (!this.isInRetryMode) {
            console.log('🚨 Primera falla detectada, entrando en modo reintento');
            this.isInRetryMode = true;
            this.scheduleNextCheck(this.retryInterval);
        } else {
            console.log(`🔄 Reintento ${this.failureCount}/${this.maxRetries + 1}`);
            
            if (this.failureCount > this.maxRetries) {
                if (!this.emailSent) {
                    this.sendAlert();
                }
                // Seguir monitoreando cada 5 minutos después del email
                this.scheduleNextCheck(this.retryInterval);
            } else {
                this.scheduleNextCheck(this.retryInterval);
            }
        }
    }
    
    resetToNormalMode() {
        this.failureCount = 0;
        this.isInRetryMode = false;
        this.emailSent = false;
        this.scheduleNextCheck(this.normalInterval);
    }
    
    scheduleNextCheck(interval) {
        setTimeout(() => {
            this.checkService().then(() => {
                if (!this.isInRetryMode) {
                    this.scheduleNextCheck(this.normalInterval);
                }
            });
        }, interval);
    }
    
    async sendAlert() {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: process.env.ALERT_EMAIL,
                subject: `🚨 ALERTA: Servicio Web Inactivo - ${this.url}`,
                html: `
                    <h2>🚨 ALERTA: Servicio Web Inactivo</h2>
                    <p><strong>URL:</strong> ${this.url}</p>
                    <p><strong>Estado:</strong> INACTIVO</p>
                    <p><strong>Intentos fallidos:</strong> ${this.failureCount}</p>
                    <p><strong>Tiempo:</strong> ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
                    
                    <h3>Detalles:</h3>
                    <ul>
                        <li>El servicio falló en el primer intento</li>
                        <li>Se realizaron ${this.maxRetries} reintentos adicionales cada 5 minutos</li>
                        <li>Todos los intentos fallaron</li>
                    </ul>
                    
                    <p><em>Este mensaje fue enviado automáticamente por el sistema de monitoreo.</em></p>
                `
            };
            
            await this.transporter.sendMail(mailOptions);
            console.log('📧 Email de alerta enviado exitosamente');
            this.emailSent = true;
        } catch (error) {
            console.error('❌ Error enviando email:', error.message);
        }
    }
    
    start() {
        console.log('🚀 Iniciando monitoreo...');
        this.checkService().then(() => {
            if (!this.isInRetryMode) {
                this.scheduleNextCheck(this.normalInterval);
            }
        });
    }
}

// Manejo de señales para cierre limpio
process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo monitoreo...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Deteniendo monitoreo...');
    process.exit(0);
});

// Iniciar el checker
const checker = new WebServiceChecker();
checker.start();