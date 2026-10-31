// Ponte segura entre a interface e o processo principal
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('grimorioNativo', {
  listar: () => ipcRenderer.invoke('camp:listar'),
  carregar: (id) => ipcRenderer.invoke('camp:carregar', id),
  salvar: (id, json) => ipcRenderer.invoke('camp:salvar', id, json),
  criar: (dados) => ipcRenderer.invoke('camp:criar', dados),
  excluir: (id) => ipcRenderer.invoke('camp:excluir', id),
  salvarImagem: (id, nome, bytes) => ipcRenderer.invoke('img:salvar', id, nome, bytes),
  exportar: (id) => ipcRenderer.invoke('camp:exportar', id),
  importarBackup: () => ipcRenderer.invoke('camp:importarBackup'),
  importarNotion: (id) => ipcRenderer.invoke('notion:importar', id),
  abrirPasta: (id) => ipcRenderer.invoke('app:abrirPasta', id),
  abrirLink: (url) => ipcRenderer.invoke('app:abrirLink', url),
  versao: () => ipcRenderer.invoke('app:versao')
});
