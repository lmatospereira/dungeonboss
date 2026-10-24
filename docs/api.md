# API

Base: `/api` no mesmo endereço do jogo. As respostas são JSON. Os erros vêm como `{"error": "mensagem para o jogador"}`.

**Autenticação:** as rotas marcadas com 🔒 exigem o cabeçalho `Authorization: Bearer <token>`. O token vem do cadastro ou do login e vale 60 dias. Um token inválido ou expirado devolve `401`.

## Saúde

`GET /api/health`: responde `{"ok": true}` quando a API e o banco estão no ar.

## Contas

### `POST /api/auth/register`

```json
{ "username": "Aventureira", "password": "segredo123", "save": { "...": "SAVE atual (opcional)" } }
```

**Regras:**
- **Nome:** de 3 a 20 caracteres (letras, números, espaço, `.`, `-` e `_`). É único, sem diferenciar maiúsculas de minúsculas.
- **Senha:** de 6 a 72 caracteres.

| Resposta | Corpo |
|---|---|
| `200` | `{ "token", "name" }` |
| `400` | Nome ou senha inválidos |
| `409` | Nome em uso |
| `429` | Muitas tentativas (limite de 10 por minuto) |

### `POST /api/auth/login`

```json
{ "username": "Aventureira", "password": "segredo123" }
```

| Resposta | Corpo |
|---|---|
| `200` | `{ "token", "name" }` |
| `401` | Nome ou senha incorretos |
| `429` | Muitas tentativas |

## Salvamento

### 🔒 `GET /api/me`

```json
{
  "profile": { "name", "rating", "wins", "losses", "def_wins", "def_losses", "power", "defense": [{ "k", "lvl", "evo" }] },
  "save": { "...": "SAVE salvo, ou null" },
  "saveUpdatedAt": "2026-10-20T12:00:00Z"
}
```

### 🔒 `PUT /api/save`

```json
{ "save": { "...": "SAVE" }, "defense": [{ "k": "brom", "lvl": 5, "evo": 2 }, "... 4 heróis"], "power": 1234 }
```

- **`save`:** é guardado inteiro (jsonb).
- **`defense`:** só é aceita com 4 heróis válidos e diferentes. O nível vai de 1 a 30 e a evolução de 1 a 3.
- **Resposta:** `{ "ok": true, "profile" }`.
- **Limite:** 60 por minuto.

## Invasão

### 🔒 `GET /api/arena/opponents`

Devolve até 3 jogadores com equipe de defesa e troféus próximos aos seus:

```json
{ "opponents": [{ "id": "12", "name", "rating", "power", "defense": [{ "k", "lvl", "evo" }] }] }
```

### 🔒 `POST /api/arena/start`

Corpo: `{ "opponentId": 12 }`.

| Resposta | Corpo |
|---|---|
| `200` | `{ "raidId": 99 }` (ticket válido por 30 minutos) |
| `400` | Oponente inválido, incluindo você mesmo |
| `404` | O oponente não tem mais defesa |

### 🔒 `POST /api/arena/finish`

Corpo: `{ "raidId": 99, "won": true }`.

- **`200`:** `{ "delta", "counted", "profile" }`.
  - `delta` é a variação de troféus do atacante; o defensor recebe `-delta`.
  - `counted` vem `false` quando a vitória durou menos de 8 segundos (`delta` 0).
- **`409`:** a invasão já terminou ou o ticket expirou.

### 🔒 `GET /api/arena/defenses`

Devolve as invasões que você sofreu e ainda não viu, e marca todas como vistas:

```json
{ "defenses": [{ "name": "atacante", "won": true, "delta": 14, "at": "..." }] }
```

`won` é do ponto de vista do defensor.

### `GET /api/arena/leaderboard`

Devolve os 50 primeiros por troféus. É uma rota pública:

```json
{ "players": [{ "id", "name", "rating", "power" }] }
```
