# Controle Financeiro

Aplicação React + Vite para controle financeiro com deploy estático.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
```

O build final fica em `dist/`.

## Deploy

### Vercel

- Build command: `npm run build`
- Output directory: `dist`

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`

### Outras plataformas estáticas

Use o conteúdo de `dist/` como pasta publicada.
Se a plataforma suportar SPA fallback, mantenha a regra para redirecionar todas as rotas para `index.html`.

## Variáveis de ambiente

Se for usar o módulo de Supabase em `src/lib/supabase.js`, as variáveis devem ficar na raiz do projeto, em arquivos como `.env.local`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Essas variáveis também precisam ser configuradas no painel da plataforma de deploy.
