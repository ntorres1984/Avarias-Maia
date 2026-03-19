# Plataforma de Registo e Reporte de Avarias — Maia

Starter em Next.js + Supabase para registo, acompanhamento e reporte de avarias nas unidades de saúde da Maia.

## Funcionalidades incluídas
- autenticação com Supabase
- perfis e unidades
- criação e edição de ocorrências
- histórico de alterações
- anexos em Storage
- dashboard com KPI e gráficos
- importação com pré-visualização
- exportação para Excel
- SLA por prioridade
- notificações por email
- gestão base de utilizadores

## Arranque rápido
1. Criar projeto Supabase e preencher `.env.local` a partir de `.env.example`
2. Executar o SQL em `sql/001_init.sql`
3. Criar o bucket privado `occurrence-attachments`
4. Instalar dependências: `npm install`
5. Arrancar: `npm run dev`

## Notas
- O projeto foi preparado como base de arranque. Convém validar tipos e relações no teu ambiente Supabase.
- Para produção, recomenda-se Vercel + Supabase + Resend.
update deploy
