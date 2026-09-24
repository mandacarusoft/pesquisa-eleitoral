# Sistema Web de Pesquisa Eleitoral — Banco de Dados em Português

Arquitetura full-stack com cadastro dinâmico de perguntas e alternativas pelo painel do Admin.
**Todo o banco de dados (tabelas, colunas e valores) e toda a API estão em português.**

## Stack
- **Frontend**: React + Vite, Tailwind CSS, Lucide Icons, Recharts, React Router
- **Backend**: Node.js + Express, **MySQL** (via `mysql2`, pool assíncrono), JWT, bcryptjs
- **Banco**: MySQL 8.x local (`pesquisa_eleitoral`)

---

## Estrutura do banco (em português)

| Tabela | Colunas |
|---|---|
| `usuarios` | id, nome, email, senha_hash, papel (`admin`\|`pesquisador`), criado_em |
| `pesquisas` | id, titulo, cidade, situacao (`ativa`\|`encerrada`), criado_em |
| `perguntas` | id, pesquisa_id (FK), texto, tipo (`unica_escolha`\|`multipla_escolha`\|`texto_livre`\|`demografica`), ordem, obrigatoria |
| `alternativas` | id, pergunta_id (FK), texto, ordem |
| `sessoes` | id (UUID), pesquisa_id (FK), pesquisador_id (FK), bairro, zona (`Urbana`\|`Rural`), criado_em |
| `respostas` | id, sessao_id (FK), pergunta_id (FK), alternativa_id (FK opcional), resposta_texto (opcional) |

Ver `backend/sql/schema.sql` para o DDL completo. Todas as FKs usam `ON DELETE CASCADE` (exceto `alternativa_id`, que usa `ON DELETE SET NULL`).

---

## 1. Instalar o MySQL na máquina

### Ubuntu / Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl enable --now mysql
sudo mysql_secure_installation
```

### macOS (Homebrew)
```bash
brew install mysql
brew services start mysql
```

### Windows
Baixe o **MySQL Installer** em https://dev.mysql.com/downloads/installer/ e instale o "MySQL Server" (marque para rodar como serviço).

Confirme que está rodando:
```bash
mysql -u root -p -e "SELECT VERSION();"
```

---

## 2. Criar o banco e o usuário da aplicação

### Opção A — Automática (recomendada)
Configure o `.env` do backend (passo 3) com um usuário que tenha permissão de criar bancos (ex: `root`) e deixe `AUTO_MIGRATE=true`. O backend cria o banco/tabelas e faz o seed inicial ao subir.

> Crie ao menos o banco vazio antes:
> ```bash
> mysql -u root -p -e "CREATE DATABASE pesquisa_eleitoral CHARACTER SET utf8mb4;"
> ```

### Opção B — Manual (schema versionado)
```bash
cd backend
mysql -u root -p < sql/schema.sql          # cria banco + tabelas em portugues
mysql -u root -p < sql/create_user.sql     # opcional: usuario dedicado 'pesquisa_user'
npm run db:init                            # roda o seed inicial (usuarios + pesquisa demo)
```

---

## 3. Configurar e rodar o backend

```bash
cd backend
cp .env.example .env
```

Edite `backend/.env`:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=pesquisa_user
DB_PASSWORD=sua-senha-aqui
DB_NAME=pesquisa_eleitoral
JWT_SECRET=troque-esta-chave
AUTO_MIGRATE=true
PORT=4000
```

```bash
npm install
npm run dev
```

Verifique: `curl http://localhost:4000/api/status` → `{"status":"ok","banco":"mysql-conectado"}`

Usuários criados no seed:
- Admin: `admin@pesquisa.com` / `admin123`
- Pesquisador: `pesquisador@pesquisa.com` / `pesq123`

**Troque essas senhas e o `JWT_SECRET` antes de usar em produção.**

---

## 4. Rodar o frontend

```bash
cd frontend
npm install
npm run dev
```
Acesse **http://localhost:5173**.

---

## Endpoints da API (rotas em português)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/status` | Verifica conexão com o MySQL |
| POST | `/api/autenticacao/login` | Login — body `{email, senha}` → retorna `{token, usuario}` |
| POST | `/api/autenticacao/registrar` | Admin cria usuários |
| GET | `/api/usuarios` | Listar usuários (admin) |
| GET/POST | `/api/pesquisas` | Listar/criar pesquisas |
| PUT/DELETE | `/api/pesquisas/:id` | Atualizar/excluir pesquisa |
| GET | `/api/pesquisas/:id/completa` | Pesquisa com `perguntas[].alternativas[]` |
| POST | `/api/perguntas` | Criar pergunta (com alternativas inline) |
| PUT/DELETE | `/api/perguntas/:id` | Atualizar/excluir pergunta |
| PUT | `/api/pesquisas/:id/perguntas/reordenar` | Body `{ids: [...]}` |
| POST | `/api/alternativas` | Adicionar alternativa |
| PUT/DELETE | `/api/alternativas/:id` | Atualizar/excluir alternativa |
| PUT | `/api/perguntas/:id/alternativas/reordenar` | Body `{ids: [...]}` |
| POST | `/api/sessoes` | Iniciar sessão de coleta — body `{pesquisa_id, bairro, zona}` |
| POST | `/api/sessoes/:id/respostas` | Gravar respostas — body `{respostas: [...]}`  |
| GET | `/api/analises/:pesquisaId` | Métricas + distribuição por pergunta (filtros: `bairro`, `pesquisador_id`, `de`, `ate`) |
| GET | `/api/analises/:pesquisaId/exportar` | Exportação CSV |

## Segurança
- Rotas de escrita em pesquisas/perguntas/alternativas exigem `papel: admin`.
- Rotas de coleta exigem `papel: pesquisador` (ou admin).
- Nunca commite o `backend/.env` (já está no `.gitignore`).
- Em produção, use um usuário MySQL restrito ao schema `pesquisa_eleitoral` (`sql/create_user.sql`).
- Backup: `mysqldump -u root -p pesquisa_eleitoral > backup.sql`
