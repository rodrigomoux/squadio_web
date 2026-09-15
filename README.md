# Squadio Web

Aplicação Next.js 16 com autenticação segura via JWT encriptado (JWE), cliente HTTP Axios com interceptors e middleware de proteção de rotas.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Axios** — cliente HTTP com interceptors
- **jose** — JWT encriptado (JWE com A256GCM)
- **Zod** — validação de dados

## Início rápido

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Credenciais de desenvolvimento

Quando a API backend não está disponível, o login usa um mock em modo `development`:

- **E-mail:** `admin@squadio.com`
- **Senha:** `password123`

## Arquitetura de autenticação

```
Login → API Route → Backend API
                 → Encripta JWT (JWE) → Cookies httpOnly
Cliente → ApiClient (Axios) → Interceptor adiciona Bearer token
                            → 401 → Refresh automático via /api/auth/refresh
Middleware → Valida JWT encriptado nos cookies → Protege rotas
```

### Segurança

- Tokens armazenados em cookies **httpOnly**, **secure** (produção) e **sameSite: lax**
- JWT **encriptado** (JWE) com algoritmo `dir` + `A256GCM` via biblioteca `jose`
- Access token de curta duração (15 min) + refresh token (7 dias)
- Refresh automático transparente via interceptor Axios
- Middleware protege rotas no edge antes da renderização

## Estrutura do projeto

```
src/
├── config/
│   ├── api.config.ts       # Configuração da API
│   └── auth.config.ts      # Configuração de autenticação
├── lib/auth/
│   ├── jwt.ts              # Encriptação/desencriptação JWE
│   ├── cookies.ts            # Gerenciamento de cookies
│   └── session.ts            # Sessão server-side
├── services/
│   ├── api/
│   │   ├── ApiClient.ts      # Classe Axios com interceptors
│   │   └── token-store.ts    # Armazenamento em memória do token
│   └── auth/
│       └── AuthService.ts    # Serviço de autenticação
├── providers/
│   └── AuthProvider.tsx      # Context de autenticação (client)
├── middleware.ts             # Proteção de rotas
└── app/
    ├── api/auth/             # Rotas de login, logout, refresh, me
    ├── login/                # Página de login
    └── dashboard/            # Área protegida
```

## Uso do ApiClient

```typescript
import { apiClient } from "@/services/api/ApiClient";

// GET
const users = await apiClient.get<User[]>("/users");

// POST
const created = await apiClient.post<User>("/users", { name: "João" });
```

O interceptor adiciona automaticamente o header `Authorization` e renova o token em caso de `401`.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API backend |
| `NEXT_PUBLIC_JWT_ENCRYPTION_SECRET` | Chave de encriptação (mín. 32 caracteres) |
| `API_TIMEOUT` | Timeout das requisições em ms (opcional) |
