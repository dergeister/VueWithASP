import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-vue';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';

const baseFolder =
    process.env.APPDATA !== undefined && process.env.APPDATA !== ''
        ? `${process.env.APPDATA}/ASP.NET/https`
        : `${process.env.HOME}/.aspnet/https`;

const certificateArg = process.argv.map(arg => arg.match(/--name=(?<value>.+)/i)).filter(Boolean)[0];
const certificateName = certificateArg ? certificateArg.groups.value : "vuewithasp.client";

if (!certificateName) {
    console.error('Invalid certificate name. Run this script in the context of an npm/yarn script or pass --name=<<app>> explicitly.')
    process.exit(-1);
}

const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    if (0 !== child_process.spawnSync('dotnet', [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password',
    ], { stdio: 'inherit', }).status) {
        throw new Error("Could not create certificate.");
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    resolve: {
        alias: {
            '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
            '@enums': fileURLToPath(new URL('./src/domain/enums', import.meta.url)),
            '@models': fileURLToPath(new URL('./src/domain/models', import.meta.url)),
            '@factories': fileURLToPath(new URL('./src/domain/factories', import.meta.url)),
            '@common': fileURLToPath(new URL('./src/presentation/modules/_common', import.meta.url)),
            '@home': fileURLToPath(new URL('./src/presentation/modules/home', import.meta.url)),
            '@checkout': fileURLToPath(new URL('./src/presentation/modules/checkout', import.meta.url)),
            '@i18n': fileURLToPath(new URL('./src/presentation/i18n', import.meta.url)),
            '@api': fileURLToPath(new URL('./src/infrastructure/api', import.meta.url)),
            '@router': fileURLToPath(new URL('./src/presentation/router', import.meta.url)),
            '@store': fileURLToPath(new URL('./src/application/stores', import.meta.url)),
            '@middlewares': fileURLToPath(new URL('./src/presentation/middlewares', import.meta.url)),
            '@helpers': fileURLToPath(new URL('./src/application/helpers', import.meta.url)),
            '@mixins': fileURLToPath(new URL('./src/presentation/mixins', import.meta.url)),
            '@services': fileURLToPath(new URL('./src/application/services', import.meta.url))
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@import "@assets/styles/variables.scss";`
            }
        }
    },
    server: {
        proxy: {
            '^/weatherforecast': {
                target: 'https://localhost:7055/',
                secure: false
            }
        },
        port: 5173,
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        }
    },
})
