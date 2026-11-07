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

## Login e sincronização entre dispositivos

O login usa Supabase Auth e salva receitas, despesas, contas a pagar, contas a receber e orçamentos na nuvem, separados por usuário.

1. Crie um projeto no [Supabase](https://supabase.com/) e habilite cadastro por e-mail em **Authentication > Providers**.
2. No **SQL Editor** do projeto, execute o conteúdo de [`supabase-schema.sql`](supabase-schema.sql). As políticas RLS garantem que cada conta acesse somente os próprios dados.
3. Copie a URL do projeto e a chave publicável em **Project Settings > API Keys**. Na raiz do projeto, crie `.env.local`:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
```

4. Em **Authentication > URL Configuration**, defina a URL publicada como **Site URL** e adicione também os endereços de desenvolvimento em **Redirect URLs**, se necessário. Reinicie o servidor (`npm run dev`) e crie sua conta pelo botão **Criar conta**. Se a confirmação de e-mail estiver habilitada, confirme a mensagem antes de entrar.
5. Cadastre as mesmas variáveis no painel da Vercel ou Netlify e faça um novo deploy.

Na primeira entrada, se houver lançamentos salvos neste navegador, o sistema pergunta se deseja importá-los para a conta. Em outros dispositivos, basta entrar com o mesmo e-mail e senha. A chave publicável pode ficar no frontend; nunca use uma chave `service_role` no aplicativo.
