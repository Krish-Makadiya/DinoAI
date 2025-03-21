import { WebContainer } from '@webcontainer/api';

let webContainerInstance = null;

export async function getWebContainerInstance() {
    if (!webContainerInstance) {
        webContainerInstance = await WebContainer.boot({
            ports: [8000],
            serverOptions: {
                port: 8000,
                hostname: '0.0.0.0'
            }
        });
    }
    return webContainerInstance;
}