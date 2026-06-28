# Cola Dani — Núcleo OS

Panel web estático de la **BD de tareas Cola Dani**.

🌐 **Ver panel:** https://danibrainclaw.github.io/cola-dani/

## ¿Qué es?

Visor público del estado de la cola de tareas de Dani. Lee un `data.json` snapshot que se regenera automáticamente cada 5 minutos desde la BD SQLite.

## Arquitectura

```
┌─────────────────────┐         ┌──────────────────────┐
│ VPS (OpenClaw)      │  cron   │ GitHub Pages         │
│ SQLite queue.db     │ ──────► │ index.html +         │
│ snapshot.py + push  │  cada   │ data.json estático   │
└─────────────────────┘  5 min  └──────────────────────┘
                                          ▲
                                          │ https
                                          │
                                  ┌───────────────┐
                                  │ Navegador Dani│
                                  └───────────────┘
```

## Stack

- HTML + CSS + JS vanilla (sin frameworks, sin build)
- Snapshot JSON estático
- Auto-refresh cada 30s desde el navegador
- Sin backend en runtime (todo GitHub Pages)

## Cómo actualizar

1. VPS genera `data.json` desde `queue.db`:
   ```bash
   python3 scripts/snapshot.py
   ```
2. Push al repo:
   ```bash
   git add data.json && git commit -m "snapshot" && git push
   ```
3. GitHub Pages sirve automáticamente

## Privacidad

El snapshot es **público** (igual que el repo). NO contiene datos sensibles de clientes — solo títulos de tareas, fechas y métricas agregadas.

Si en algún momento se quieren añadir datos sensibles (importes, teléfonos), mover el repo a privado y/o filtrar el snapshot.