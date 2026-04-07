# Setup Firebase bot-whatsapp-ai

## Papel das bases

`bot-whatsapp-ai` é a base do domínio conversacional e de integração do bot/core.
O Firebase project ID real criado no console é `bot-whatsapp-ai-d10ef`.

`agendamento-ai` continua sendo a base operacional do admin de agenda nesta fase.
O fluxo alvo fica:

```text
BOT -> CORE -> AGENDAMENTO
```

Não há migração completa nesta etapa. A preparação serve para permitir que o bot/core comece a ler configuração própria, catálogo de serviços e eventos técnicos sem acoplar isso ao admin de agendamento.

## Serviços Firebase

Serviço mínimo nesta fase:

- Cloud Firestore: banco principal do bot/core.

Serviços não obrigatórios agora:

- Firebase Authentication: não é necessário para a escrita técnica quando o bot/core usa backend, Admin SDK, IAM ou seed via CLI. Será necessário antes de liberar leitura administrativa direta pelo client SDK contra esta nova base.
- Analytics: existe `measurementId` na config web, mas não é requisito do core.
- Storage: não é necessário no escopo inicial.

## Coleções

Versão mínima para iniciar:

- `tenants`: cadastro do tenant lógico, começando por `clinica-devtec`.
- `projects`: raiz operacional do Core por tenant, começando por `core-project-clinica-devtec`.
- `services`: catálogo consultável pelo bot para montar menu e validar solicitações.
- `botProfiles`: identidade, mensagens e menu principal do bot por projeto.
- `projectConnections`: ponte configurável do core para `agendamento-ai`.
- `integrationLogs`: trilha técnica mínima de bootstrap e integrações.

Coleções runtime previstas:

- `sessions`: estado de conversa por contato/canal.
- `serviceRequests`: solicitações normalizadas criadas pelo bot/core.
- `inboundEvents`: webhooks e mensagens recebidas.
- `outboundEvents`: mensagens e despachos emitidos.
- `integrationEvents`: eventos de integração outbound para o domínio de agendamento.
- `contacts`: identidade por canal quando o core precisar materializar contatos.

## Regras Firestore

As regras dedicadas estão em `firestore.bot-whatsapp-ai.rules` e são referenciadas por `firebase.bot-whatsapp-ai.json`.

Estado atual para homologação:

- leitura liberada temporariamente para o painel/core conseguir homologar sem Firebase Auth;
- escrita runtime por identidade técnica com claim `botCore == true` ou `serviceRole == "bot-core"`;
- escrita sem Auth limitada ao escopo piloto `clinica-devtec` / `core-project-clinica-devtec`;
- delete bloqueado nas coleções iniciais.

Limitação consciente: este modo de rules é de desenvolvimento. A próxima etapa é remover a permissão piloto sem Auth e exigir Authentication + custom claims por tenant antes de produção.

Deploy das regras:

```bash
npm run deploy:bot-whatsapp-ai:rules
```

Comando equivalente:

```bash
firebase deploy --only firestore:rules --project bot-whatsapp-ai-d10ef --config firebase.bot-whatsapp-ai.json
```

## Envs

Use `VITE_BOT_FIREBASE_*` para a config web do domínio bot/core e `VITE_AGENDA_FIREBASE_*` para o domínio operacional da agenda.

O código mantém `VITE_FIREBASE_*` apenas como fallback legado para a agenda. O core não usa mais `VITE_FIREBASE_*` como fallback do bot.

Arquivos de referência:

```bash
.env.bot-whatsapp-ai.example
.env.agendamento-ai.example
```

Variáveis recomendadas:

- `VITE_BOT_FIREBASE_API_KEY`
- `VITE_BOT_FIREBASE_AUTH_DOMAIN`
- `VITE_BOT_FIREBASE_PROJECT_ID`
- `VITE_BOT_FIREBASE_STORAGE_BUCKET`
- `VITE_BOT_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_BOT_FIREBASE_APP_ID`
- `VITE_BOT_FIREBASE_MEASUREMENT_ID`
- `VITE_AGENDA_FIREBASE_API_KEY`
- `VITE_AGENDA_FIREBASE_AUTH_DOMAIN`
- `VITE_AGENDA_FIREBASE_PROJECT_ID`
- `VITE_AGENDA_FIREBASE_STORAGE_BUCKET`
- `VITE_AGENDA_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_AGENDA_FIREBASE_APP_ID`
- `VITE_AGENDA_FIREBASE_MEASUREMENT_ID`
- `BOT_FIREBASE_PROJECT_ID`
- `BOT_FIREBASE_SERVICE_ACCOUNT_PATH`
- `BOT_CORE_TENANT_SLUG`
- `AGENDAMENTO_FIREBASE_PROJECT_ID`
- `AGENDAMENTO_CORE_API_BASE_URL`
- `AGENDAMENTO_CORE_API_TOKEN`

Clientes no código:

- `botDb`: Firestore do projeto `bot-whatsapp-ai-d10ef`, usado por bot/core.
- `agendaDb`: Firestore do projeto `agendamento-ai-9fbfb`, usado por appointments operacionais.
- `db`: alias temporário para `botDb` durante a transição.

## Seed inicial

O seed idempotente do tenant piloto está em `scripts/seed-bot-whatsapp-ai.ts`.
Ele grava somente no project ID `bot-whatsapp-ai-d10ef` e bloqueia execução se `BOT_FIREBASE_PROJECT_ID` apontar para outro projeto.

Conteúdo criado:

- `tenants/clinica-devtec`
- `projects/core-project-clinica-devtec`
- `botProfiles/core-project-clinica-devtec`
- três serviços ativos em `services`
- uma conexão outbound ativa provider `firebase` para `agendamento-ai`
- um contato/sessão/serviceRequest de homologação do comando `/dev clinica-devtec`
- um log de bootstrap em `integrationLogs`

Executar:

```bash
npm run seed:bot-whatsapp-ai
```

Serviços iniciais para consulta do bot:

- `consulta_avaliacao`
- `retorno`
- `procedimento`

Consulta esperada para o bot/core:

```text
services where tenantSlug == "clinica-devtec" and projectId == "core-project-clinica-devtec" and active == true
```

## Integração core -> agenda

A integração explícita fica em `src/core/integrations/agendamentoAi.ts`.

Quando uma `projectConnection` ativa usa `provider = "firebase"` e `targetProjectId = "agendamento-ai-9fbfb"`, o core espelha um documento determinístico em:

```text
agendamento-ai-9fbfb / appointments / appointment-from-{serviceRequestId}
```

O payload espelhado preserva:

- `tenantSlug`
- `service.key`
- `service.label`
- `requestId`
- `contactId`
- `integrationEventId`
- `mirroredFrom.firebaseProjectId = "bot-whatsapp-ai-d10ef"`

O caminho HTTP antigo continua compatível para `projectConnections` com provider `http`.

## Logs de homologação

Logs esperados no console:

- `[firebase][bot-core] projectId=bot-whatsapp-ai-d10ef`
- `[firebase][agenda] projectId=agendamento-ai-9fbfb`
- `[bot][services] ... tenant=clinica-devtec ... servicesLoaded=3`
- `[bot][session] ... tenant=clinica-devtec ...`
- `[core][serviceRequest:create] ... service=consulta_avaliacao ...`
- `[core][confirm] ... provider=firebase targetProject=agendamento-ai-9fbfb`
- `[core][agenda-sync] appointmentMirrored ... tenant=clinica-devtec service=consulta_avaliacao`
- `[agenda][appointments] ... tenant=clinica-devtec ...`

## Checklist piloto

1. Rodar `npm run deploy:bot-whatsapp-ai:rules`.
2. Rodar `npm run seed:bot-whatsapp-ai`.
3. Abrir o painel com o projeto ativo `core-project-clinica-devtec`.
4. Confirmar que os serviços reais carregáveis do bot são `consulta_avaliacao`, `retorno`, `procedimento`.
5. Confirmar a `serviceRequest` piloto `clinica-devtec-service-request-whatsapp-dev`.
6. Verificar em `agendamento-ai-9fbfb/appointments` o documento `appointment-from-clinica-devtec-service-request-whatsapp-dev`.
7. Abrir a página de appointments e validar o filtro por `tenantSlug = "clinica-devtec"` e a exibição de `service.label`.

Observação: o runtime WhatsApp que processa literalmente `/dev clinica-devtec` não está neste repo. Este repo agora fornece os helpers e o contrato de dados para esse bot ler `services`, persistir `sessions`/`serviceRequests` no `botDb` e acionar o mirror para `agendaDb`.
